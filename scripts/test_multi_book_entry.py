from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    failures=[]
    for book,role in [('hongloumeng','贾宝玉'),('sanguoyanyi','刘备'),('shuihuzhuan','宋江'),('liaozhai','书生')]:
        context=browser.new_context(viewport={'width':390,'height':844})
        page=context.new_page()
        page.set_default_timeout(8000)
        errors=[]
        step='init'
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.add_init_script("localStorage.setItem('lingjing_onboarding_done','true');localStorage.setItem('lingjing_realname_verified','true');")
        try:
            step='detail'; page.goto((ROOT/'index.html').as_uri()+'#/novel-detail?book='+book)
            f=page.frame_locator('#stage')
            step='first-cover'; f.locator('#nd-read').click()
            step='first-bookmark'; f.locator('#cover-agree').check();f.locator('#cover-bookmark').click()
            step='first-save-list'; f.locator('#ng-progress-mask').wait_for(state='visible')
            assert f.locator('.pm-item').count()==6
            assert f.get_by_text('暂无剧情', exact=True).count()==6
            step='back-detail'; page.evaluate("book=>LJ.go('novel-detail','?book='+book)",book)
            step='second-cover'; f.locator('#nd-read').click();f.locator('#cover-agree').check();f.locator('#cover-start').click()
            page.wait_for_timeout(700)
            step='role'; f.get_by_text(role,exact=True).click();f.locator('#cm-start').click()
            step='stage-cta';
            if f.locator('#ng-r-stage-cta').is_visible(): f.locator('#ng-r-stage-cta').click()
            step='save'; f.locator('#ng-btn-global-menu').click();f.locator('#ng-menu-save').click();f.locator('#ng-progress-mask').wait_for(state='visible');f.locator('.pm-item').first.click();f.locator('#ng-progress-close').click()
            step='return-detail'; f.locator('#ng-btn-global-menu').click();f.locator('#ng-menu-back-home').click();f.locator('#nd-read').click()
            step='second-bookmark'; f.locator('#cover-agree').check();f.locator('#cover-bookmark').click()
            step='load'; f.locator('.pm-item').first.click()
            step='restored'; f.locator('#ng-v22-container').wait_for(state='visible')
            assert f.locator('#ng-stage.active').is_visible()
            step='menu'; f.locator('#ng-btn-global-menu').click()
            assert f.locator('#ng-menu-name').inner_text()==role
            out=ROOT/'screenshots'/'entry-repair';out.mkdir(parents=True,exist_ok=True)
            page.screenshot(path=str(out/(book+'-restored.png')))
            f.locator('#ng-menu-back-home').click();f.locator('#nd-back').click()
            page.wait_for_function("location.hash==='#/world-hub'")
            assert not errors,errors
            print('PASS',book)
        except Exception as e:
            failures.append((book,str(e)));print('FAIL',book,'step=',step,str(e)[:350], 'url=', page.url, 'errors=', errors, flush=True)
        finally:context.close()
    browser.close()
    assert not failures,failures
