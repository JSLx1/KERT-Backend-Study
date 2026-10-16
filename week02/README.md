# KERT 웹 백엔드 스터디 - 2주차

## 실행 방법
`npm`, `node.js`가 설치되어 있어야 합니다.
1. 터미널 실행 후, 레포지토리를 clone한 디렉토리로 이동합니다.
2. `npm install`을 실행, 의존성 패키지를 다운로드합니다.
3. clone한 디렉토리에서 `node app.js`를 실행합니다. 
4. `localhost:3000`에 서버가 열렸습니다!

## 구현한 라우트
- `GET /` : `/posts`로 redirect
- `GET /posts` : 글 목록 확인 (`keyword` 쿼리로 제목에 `keyword`가 포함된 글만 확인 가능)
- `GET /posts/new` : 새로운 글을 작성하기 위한 form 제공
- `GET /posts/:id` : id에 맞는 글의 세부 내용 확인 (삭제 버튼이 포함된 form 제공)
- `GET /:not_exist_route`: 위에 제공한 route가 아닌 route로 접속한 경우, 404 페이지로 redirect

- `POST /posts`: 글 작성, 저장 후 `GET /posts`로 redirect
- `POST /posts/:id/delete`: 해당 글 삭제 후 `GET /posts`로 redirect

## 점검 결과
```
필수 14 / 14 통과
도전 3 / 3 통과
```

## (도전) 구현한 것
- 검색: `GET /posts?keyword={KEYWORD}`로 제목에 특정 키워드를 포함한 글만 확인할 수 있습니다.
- 제목 검사: 새 글을 작성할 때, 제목이 비어있거나 공백뿐인 글은 저장하지 않습니다.
- 404 페이지: `404.ejs`로 존재하지 않는 페이지를 렌더링합니다.