"""场景世界模块：10 个沉浸式场景 + 免费档解锁控制（FR-SCENE-02/03）。

场景即状态：场景决定舞台氛围（背景/光照），Phase 19 扩展 Time/Weather/Lighting
由场景状态机驱动 3D 环境。当前免费开放 3 个，其余 Pro 锁定（402）。
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/api/scenes", tags=["scenes"])

# key: (名称, 描述, 是否免费)
SCENES: dict[str, dict] = {
    "bedroom":       {"name": "温馨卧室", "desc": "暖黄台灯，柔软被窝，最私密的夜话角落", "free": True},
    "living_room":   {"name": "客厅沙发", "desc": "周末午后的沙发，电视放着没人认真看的节目", "free": True},
    "cafe":          {"name": "雨夜咖啡馆", "desc": "窗上雨痕，热拿铁的香气，适合慢慢说心事", "free": True},
    "school":        {"name": "放学后教室", "desc": "夕阳把课桌染成橙色，粉笔灰在光里漂浮", "free": False},
    "library":       {"name": "深夜图书馆", "desc": "只有翻书声的安静角落，适合一起发呆", "free": False},
    "street":        {"name": "夏夜街道", "desc": "便利店灯光与蝉鸣，漫无目的地散步", "free": False},
    "starry_sky":    {"name": "星空下的天台", "desc": "银河铺满天顶，流星刚好经过", "free": False},
    "ancient_palace":{"name": "古风宫殿", "desc": "红墙琉璃瓦，月下执灯的长阶", "free": False},
    "sci_fi":        {"name": "太空舱", "desc": "舷窗外是缓慢旋转的蓝色地球", "free": False},
    "chibi_room":    {"name": "Q 版小屋", "desc": "软绵绵的马卡龙色童话房间", "free": False},
}

DEFAULT_SCENE = "bedroom"

# user_id -> selected scene key
_selections: dict[str, str] = {}


class SceneOut(BaseModel):
    key: str
    name: str
    desc: str
    free: bool
    selected: bool


class SelectSceneRequest(BaseModel):
    scene_key: str = Field(min_length=1, max_length=40)


@router.get("", response_model=list[SceneOut])
async def list_scenes(user: CurrentUser = Depends(get_current_user)):
    selected = _selections.get(user.user_id, DEFAULT_SCENE)
    return [
        SceneOut(key=k, name=v["name"], desc=v["desc"], free=v["free"], selected=(k == selected))
        for k, v in SCENES.items()
    ]


@router.post("/select", response_model=SceneOut)
async def select_scene(payload: SelectSceneRequest, user: CurrentUser = Depends(get_current_user)):
    scene = SCENES.get(payload.scene_key)
    if scene is None:
        raise HTTPException(status_code=404, detail="场景不存在")
    if not scene["free"]:
        raise HTTPException(
            status_code=402,
            detail={"code": "paywall_required", "message": f"场景「{scene['name']}」为 MIRAI Pro 专属"},
        )
    _selections[user.user_id] = payload.scene_key
    return SceneOut(key=payload.scene_key, name=scene["name"], desc=scene["desc"],
                    free=True, selected=True)
