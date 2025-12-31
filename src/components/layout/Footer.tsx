export function Footer() {
  return (
    <footer className="border-t bg-muted/30 backdrop-blur-sm">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* 사이트 목적 설명 */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            이 블로그는 제가 <span className="text-foreground font-medium">알고 있는 것들을 잊지 않기 위해</span> 기록하는 공간입니다.
            <br />
            직접 작성한 글도 있고, AI의 도움을 받아 정리한 글도 있습니다.
            <br />
            정확하지 않은 내용이 있을 수 있으니 참고용으로 봐주세요.
          </p>
        </div>

        {/* 저작권 */}
        <div className="text-xs text-muted-foreground/70 pt-4 border-t border-muted-foreground/10">
          © {new Date().getFullYear()} Seogyu Kim
        </div>
      </div>
    </footer>
  )
}

