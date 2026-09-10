import unittest
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI
from fastapi.testclient import TestClient
from src.core.security import CurrentUser, get_current_user
from src.modules.story.content import STORY
from src.modules.story.engine import Repository, StoryError, ending_for, initial_state
from src.modules.story.router import router

class StoryRulesTests(unittest.TestCase):
    def setUp(self):
        self.repo = Repository()
        self.s = self.repo.create("alice", {"name": "测试人物"})

    def choose(self, option):
        self.s = self.repo.choose("alice", self.s["id"], self.s["node"]["id"], str(option), self.s["revision"])

    def test_all_six_endings_reachable_and_thirty_choices(self):
        reached = set()
        for route, strategy in [(0,"wise"),(1,"wise"),(0,"bold"),(1,"bold"),(0,"normal"),(1,"true")]:
            self.s = self.repo.create("alice", {"name":"测试"})
            chapters = set()
            while self.s["node"]:
                node = self.s["node"]
                chapters.add(node["chapter"])
                if node["id"] == "common-13": option = route
                elif strategy == "true": option = 2 if node["id"] in ("common-0","common-2","common-5") else 0
                elif strategy == "wise": option = 0
                elif strategy == "bold": option = 1
                else: option = 2
                self.choose(option)
            self.assertEqual(self.s["completed_choices"],30)
            self.assertEqual(chapters,set(range(1,7)))
            reached.add(self.s["ending"]["id"])
        self.assertEqual(reached,{e["id"] for e in STORY["endings"]})

    def test_rewind_restores_all_state_and_invalidates_revision(self):
        initial = self.s
        for _ in range(15): self.choose(0)
        self.assertEqual(self.s["state"]["route"],"power")
        revision = self.s["revision"]
        self.s = self.repo.rewind("alice",self.s["id"],0,revision)
        self.assertEqual(self.s["state"],initial["state"])
        self.assertEqual(self.s["history"],[])
        self.assertGreater(self.s["revision"],revision)
        with self.assertRaises(StoryError): self.repo.choose("alice",self.s["id"],"common-0","0",revision)

    def test_ending_requires_relationship_as_well_as_attributes(self):
        state=initial_state(); state["route"]="bond"; state["attributes"]["wisdom"]=80
        self.assertEqual(ending_for(state)["id"],"normal")
        state["relationships"]["貂蝉"]=55
        self.assertEqual(ending_for(state)["id"],"bond_he")

    def test_concurrent_choice_has_one_winner(self):
        def submit(_):
            try: self.repo.choose("alice",self.s["id"],"common-0","0",0); return 200
            except StoryError as e: return e.status
        with ThreadPoolExecutor(max_workers=4) as pool:
            results=list(pool.map(submit,range(4)))
        self.assertEqual(results.count(200),1)
        self.assertEqual(results.count(409),3)
        self.assertEqual(self.repo.get("alice",self.s["id"])["completed_choices"],1)

    def test_ownership_invalid_choice_and_private_card(self):
        for fn in [lambda:self.repo.get("bob",self.s["id"]), lambda:self.repo.choose("alice",self.s["id"],"common-1","0",0), lambda:self.repo.choose("alice",self.s["id"],"common-0","99",0), lambda:self.repo.destiny("alice",self.s["id"])]:
            with self.assertRaises(StoryError): fn()
        self.assertEqual(self.repo.get("alice",self.s["id"])["revision"],0)
        self.assertNotIn("flags",self.s["state"])
        self.assertNotIn("effects",self.s["node"]["options"][0])

    def test_content_graph_has_no_broken_links_or_dead_ends(self):
        visited=set()
        def walk(node_id,path):
            self.assertNotIn(node_id,path)
            node=STORY["nodes"][node_id]; visited.add(node_id)
            self.assertTrue(2<=len(node["options"])<=4)
            for nxt in {o["next"] for o in node["options"]}:
                if nxt is None: self.assertEqual(len(path)+1,30)
                else: walk(nxt,path+[node_id])
        walk(STORY["start"],[])
        self.assertEqual(visited,set(STORY["nodes"]))

class StoryApiTests(unittest.TestCase):
    def setUp(self):
        app=FastAPI(); app.include_router(router)
        app.dependency_overrides[get_current_user]=lambda:CurrentUser("test-owner",False)
        self.app=app; self.client=TestClient(app)

    def test_identity_validation_and_play(self):
        r=self.client.post("/api/story-sessions",json={"story_id":"lubu","identity_mode":"custom","name":"  ","background":"测试"})
        self.assertEqual(r.status_code,422)
        self.assertEqual(self.client.post("/api/story-sessions",json={"story_id":"darcy"}).status_code,422)
        r=self.client.post("/api/story-sessions",json={"story_id":"lubu","identity_mode":"custom","name":"行舟","background":"平行世界的来客"})
        self.assertEqual(r.status_code,201)
        s=r.json(); self.assertEqual(s["identity"]["name"],"行舟")
        path="/api/story-sessions/"+s["id"]
        self.assertEqual(self.client.post(path+"/choices",json={"choice_id":"common-0","option_id":"0","expected_revision":0,"effects":{"wisdom":100}}).status_code,422)
        self.assertEqual(self.client.post(path+"/choices",json={"choice_id":"common-0","option_id":"0","expected_revision":0}).status_code,200)
        self.app.dependency_overrides[get_current_user]=lambda:CurrentUser("other",False)
        self.assertEqual(self.client.get(path).status_code,404)
        self.assertEqual(self.client.get(path+"/destiny").status_code,404)

if __name__=="__main__": unittest.main()
