import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '../src')
const lines = fs.readFileSync(path.join(srcDir, 'index.css'), 'utf8').split(/\r?\n/)

const base = lines.slice(2, 99).join('\n') + '\n'
const landing = lines.slice(99, 1896).join('\n') + '\n'
const auth = lines.slice(1896, 2630).join('\n') + '\n'
const editor = lines.slice(2630).join('\n') + '\n'

const stylesDir = path.join(srcDir, 'styles')
fs.mkdirSync(stylesDir, { recursive: true })
fs.writeFileSync(path.join(stylesDir, 'base.css'), base)
fs.writeFileSync(path.join(stylesDir, 'landing.css'), landing)
fs.writeFileSync(path.join(stylesDir, 'auth.css'), auth)
fs.writeFileSync(path.join(stylesDir, 'editor-and-modals.css'), editor)

const entry = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+KR:wght@600;700;800&family=Outfit:wght@500;600;700;800&display=swap');
@import './styles/base.css';
@import './styles/landing.css';
@import './styles/auth.css';
@import './styles/editor-and-modals.css';
`
fs.writeFileSync(path.join(srcDir, 'index.css'), entry)
console.log('split-css OK')
