from pathlib import Path
p=Path('apps/web/src/app/stories/page.tsx');s=p.read_text(encoding='utf-8')
s=s.replace('import Link from "next/link";', 'import Link from "next/link";\nimport { Modal } from "@/components/ui/Modal";')
s=s.replace('{selected && <section className="mt-6 rounded-3xl border border-purple-300/25 bg-white/5 p-6" aria-label="入世身份">\n        <h2 className="text-xl">你将以怎样的身份入世？</h2>', '{selected && <Modal open={!!selected} onClose={() => { if (!busy) setSelected(null); }} title="你将以怎样的身份入世？">')
s=s.replace('{busy ? "正在入世…" : "开始这一世"}</button>\n      </section>}', '{busy ? "正在入世…" : "开始这一世"}</button>\n        {error && <p role="alert" className="mt-4 text-sm text-red-200">{error}</p>}\n      </Modal>}')
s=s.replace('onClick={() => setSelected(s)}', 'onClick={() => { setError(""); setSelected(s); }}')
p.write_text(s,encoding='utf-8')
p=Path('apps/web/src/store/useChatStore.ts');s=p.read_text(encoding='utf-8').replace('本地演示环境：记忆与情绪为规则模拟，Phase 9 接入模型','开发体验：当前回复、记忆与情绪使用本地规则模拟。');p.write_text(s,encoding='utf-8')
p=Path('apps/web/src/app/onboarding/page.tsx');s=p.read_text(encoding='utf-8').replace('role="radio" aria-checked={companion===c.id}', '''role="radio" aria-checked={companion===c.id} tabIndex={companion===c.id?0:-1} onKeyDown={e=>{if(['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'preset_ling':e.key==='End'?'preset_xiaoman':companion==='preset_ling'?'preset_xiaoman':'preset_ling';setCompanion(next);const group=e.currentTarget.parentElement;requestAnimationFrame(()=>group?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus())}}}''');p.write_text(s,encoding='utf-8')
