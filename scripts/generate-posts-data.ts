// scripts/generate-posts-data.ts
// 빌드 타임에 실행되어 모든 마크다운 파일을 posts.json과 contentTree.json으로 변환

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { glob } from 'glob'
import { slugify } from 'transliteration'
import LZString from 'lz-string'

interface Post {
  id: string
  slug: string
  path: string           // 폴더 경로 (예: "blockchain/ethereum")
  fullPath: string       // 전체 경로 (예: "blockchain/ethereum/post-slug")
  title: string
  excerpt: string
  content: string
  docType: 'guide' | 'summary' | 'original'
  category: string
  tags: string[]
  readingTime: number
  wordCount: number
  isFeatured: boolean
  isPublic: boolean
  date?: string
}

interface ContentNode {
  name: string           // 폴더/파일 표시 이름
  type: 'folder' | 'post'
  path: string           // 전체 경로
  slug?: string          // post인 경우 slug
  title?: string         // post인 경우 제목
  children?: ContentNode[]
}

const PROJECT_ROOT = process.cwd()
const CONTENT_DIR = path.join(PROJECT_ROOT, 'src/content')
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src/data/posts.json')
const TREE_OUTPUT_FILE = path.join(PROJECT_ROOT, 'src/data/contentTree.json')

// 한글을 로마자 slug로 변환
function createSlug(text: string): string {
  return slugify(text, { 
    lowercase: true,
    separator: '-'
  })
}

// excerpt에서 HTML 태그, 마크다운 문법, 옵시디언 링크 등을 정리
function cleanExcerpt(text: string): string {
  return text
    // Excalidraw 경고 문구 제거
    .replace(/==⚠.*?⚠==/g, '')
    // HTML 태그 제거
    .replace(/<[^>]+>/g, '')
    // 옵시디언 링크 제거 (obsidian://open?...)
    .replace(/\(obsidian:\/\/[^)]+\)/g, '')
    // 마크다운 이미지 제거 ![[...]]
    .replace(/!\[\[[^\]]+\]\]/g, '')
    // 마크다운 링크 텍스트만 남기기 [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 위키 링크 제거 [[...]]
    .replace(/\[\[[^\]]+\]\]/g, '')
    // 코드 블록 제거
    .replace(/```[\s\S]*?```/g, '')
    // 인라인 코드 제거
    .replace(/`[^`]+`/g, '')
    // 마크다운 헤더 기호 제거
    .replace(/^#{1,6}\s+/gm, '')
    // 리스트 기호 제거
    .replace(/^[\s]*[-*+]\s+/gm, '')
    // 순서 리스트 기호 제거
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // 인용 기호 제거
    .replace(/^>\s*/gm, '')
    // 연속 공백 정리
    .replace(/\s+/g, ' ')
    // 앞뒤 공백 제거
    .trim()
    // 200자로 제한
    .substring(0, 200)
}

// Excalidraw 관련 내용 처리
function processExcalidrawContent(content: string): string {
  let processed = content;

  // 1. Excalidraw 경고 문구 제거
  processed = processed.replace(/==⚠.*?⚠==/g, '');

  // 2. "## Text Elements" 섹션부터 "## Drawing" 직전까지 제거
  processed = processed.replace(/## Text Elements[\s\S]*?(?=## Drawing)/g, '');

  // 3. %% 마커 및 내용 제거 (Excalidraw 주석)
  processed = processed.replace(/^%%.*$/gm, '');

  // 4. Obsidian Excalidraw 텍스트 요소 ID 제거 (e.g., ^qZ8uQpj5)
  processed = processed.replace(/\s\^[a-zA-Z0-9]{8,12}(?=\s|$)/g, '');

  // 5. compressed-json 블록 처리
  const regex = /```compressed-json\s*?\n([\s\S]*?)```/g;
  processed = processed.replace(regex, (match, p1) => {
    try {
      const data = p1.replace(/\s/g, '');
      const decompressed = LZString.decompressFromBase64(data);
      if (decompressed) {
        return `\`\`\`excalidraw-json\n${decompressed}\n\`\`\``;
      }
    } catch (e) {
      console.warn('❌ Failed to decompress Excalidraw block');
    }
    return match;
  });

  return processed.trim();
}

// 비공개 콘텐츠 제거
function removePrivateContent(content: string): string {
  let processed = content;
  
  // 1. HTML 주석 방식: <!-- private --> ... <!-- /private -->
  processed = processed.replace(/<!--\s*private\s*-->[\s\S]*?<!--\s*\/private\s*-->/g, '');
  
  // 2. Obsidian Callout 방식: > [!private] 블록 전체 제거
  processed = processed.replace(/^>\s*\[!private\].*$(\n^>.*$)*/gm, '');
  
  return processed;
}

// 상대 이미지 경로를 절대 경로로 변환
// Obsidian에서는 ./images/xxx.png 사용, 빌드 시 /images/xxx.png로 변환
function convertImagePaths(content: string): string {
  // 마크다운 이미지 문법: ![alt](path)
  return content.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, imgPath) => {
      // 이미 절대 경로이거나 URL인 경우 그대로 유지
      if (imgPath.startsWith('/') || imgPath.startsWith('http')) {
        return match;
      }
      
      // 상대 경로 처리 (./images/xxx.png 또는 images/xxx.png)
      const cleanPath = imgPath.replace(/^\.\//, '');
      
      // /images/ 폴더 기준 절대 경로로 변환
      // 이미지 파일명만 추출하여 /images/{filename} 형태로 변환
      const fileName = path.basename(cleanPath);
      const absolutePath = `/images/${fileName}`;
      
      return `![${alt}](${absolutePath})`;
    }
  );
}

function parseMarkdownFile(filePath: string, relativePath: string): Post | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    let frontmatter: Record<string, any> = {}
    let rawMarkdown = content

    try {
      const parsed = matter(content)
      frontmatter = parsed.data
      rawMarkdown = parsed.content
    } catch {
      const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
      if (match) {
        rawMarkdown = match[2]
      }
    }

    const fileName = path.basename(filePath, '.md')
    const wordCount = rawMarkdown.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)
    
    // slugify로 URL-safe slug 생성
    const slug = createSlug(fileName)
    
    // 폴더 경로 계산 (src/content/ 기준)
    const dirPath = path.dirname(relativePath)
    const folderPath = dirPath === '.' ? '' : dirPath
    
    // 전체 경로 생성 (폴더경로/slug)
    const fullPath = folderPath ? `${folderPath}/${slug}` : slug

    // excerpt 생성: frontmatter에 있으면 사용, 없으면 본문에서 생성
    let excerpt = frontmatter.excerpt || rawMarkdown.substring(0, 300)
    excerpt = cleanExcerpt(excerpt)

    // 본문 내용 처리
    let processedContent = processExcalidrawContent(rawMarkdown)
    processedContent = removePrivateContent(processedContent)
    processedContent = convertImagePaths(processedContent)

    return {
      id: fileName,
      slug: slug,
      path: folderPath,
      fullPath: fullPath,
      title: frontmatter.title || fileName,
      excerpt: excerpt,
      content: processedContent,
      docType: 'original',
      category: frontmatter.category || 'Uncategorized',
      tags: frontmatter.tags || [],
      readingTime,
      wordCount,
      isFeatured: frontmatter.isFeatured || false,
      isPublic: frontmatter.public === true,
      date: String(frontmatter.date || new Date().toISOString().split('T')[0])
    }
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error)
    return null
  }
}

// 폴더 구조를 트리로 변환
function buildContentTree(posts: Post[]): ContentNode[] {
  const root: ContentNode[] = []
  
  // 폴더 구조를 저장할 맵
  const folderMap = new Map<string, ContentNode>()
  
  // 먼저 모든 폴더 경로를 수집
  const allFolders = new Set<string>()
  posts.forEach(post => {
    if (post.path) {
      const parts = post.path.split('/')
      let current = ''
      parts.forEach(part => {
        current = current ? `${current}/${part}` : part
        allFolders.add(current)
      })
    }
  })
  
  // 폴더 노드 생성 (정렬된 순서로)
  Array.from(allFolders).sort().forEach(folderPath => {
    const parts = folderPath.split('/')
    const name = parts[parts.length - 1]
    const parentPath = parts.slice(0, -1).join('/')
    
    const folderNode: ContentNode = {
      name: formatFolderName(name),
      type: 'folder',
      path: folderPath,
      children: []
    }
    
    folderMap.set(folderPath, folderNode)
    
    if (parentPath) {
      const parent = folderMap.get(parentPath)
      if (parent && parent.children) {
        parent.children.push(folderNode)
      }
    } else {
      root.push(folderNode)
    }
  })
  
  // 포스트를 해당 폴더에 추가
  posts.forEach(post => {
    const postNode: ContentNode = {
      name: post.title,
      type: 'post',
      path: post.fullPath,
      slug: post.slug,
      title: post.title
    }
    
    if (post.path) {
      const parent = folderMap.get(post.path)
      if (parent && parent.children) {
        parent.children.push(postNode)
      }
    } else {
      // 루트 레벨 포스트
      root.push(postNode)
    }
  })
  
  // 폴더 내에서 포스트를 제목 순으로 정렬
  function sortChildren(nodes: ContentNode[]) {
    nodes.sort((a, b) => {
      // 폴더가 먼저
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      // 같은 타입이면 이름순
      return a.name.localeCompare(b.name, 'ko')
    })
    
    nodes.forEach(node => {
      if (node.children) {
        sortChildren(node.children)
      }
    })
  }
  
  sortChildren(root)
  
  return root
}

// 폴더 이름을 보기 좋게 포맷
function formatFolderName(name: string): string {
  // 스네이크케이스나 케밥케이스를 공백으로 변환하고 첫 글자 대문자
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

function generate() {
  console.log('📝 Generating posts data...')
  
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`❌ Content directory not found: ${CONTENT_DIR}`)
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true })
    fs.writeFileSync(OUTPUT_FILE, '[]')
    fs.writeFileSync(TREE_OUTPUT_FILE, '[]')
    return
  }

  // 재귀적으로 모든 .md 파일 탐색
  const files = glob.sync('**/*.md', { 
    cwd: CONTENT_DIR,
    nodir: true 
  })
  console.log(`📁 Found ${files.length} markdown files`)

  const posts = files
    .map(relativePath => {
      const fullPath = path.join(CONTENT_DIR, relativePath)
      return parseMarkdownFile(fullPath, relativePath)
    })
    .filter((post): post is Post => post !== null)
    // 공개 글만 포함
    .filter(post => post.isPublic)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  console.log(`✅ Parsed ${posts.length} public posts successfully`)

  // 콘텐츠 트리 생성
  const contentTree = buildContentTree(posts)

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true })
  
  // Write JSON files
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2))
  console.log(`💾 Saved posts to ${OUTPUT_FILE}`)
  
  fs.writeFileSync(TREE_OUTPUT_FILE, JSON.stringify(contentTree, null, 2))
  console.log(`🌲 Saved content tree to ${TREE_OUTPUT_FILE}`)
}

generate()
