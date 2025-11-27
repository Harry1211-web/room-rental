// /middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. Định nghĩa các trang CÔNG KHAI (PUBLIC_PAGES)
// Người dùng KHÔNG cần (hoặc KHÔNG NÊN) đăng nhập để truy cập.
const PUBLIC_PAGES = [
  '/', // Trang chủ
  '/pages/advanced_search', // Trang tìm kiếm nâng cao
  '/auth', // Trang đăng nhập/đăng ký
  // ➡️ ĐÃ THÊM: Cho phép truy cập trang chi tiết phòng động (/room/[id])
  '/room', 
];

// Đường dẫn chuyển hướng khi chưa đăng nhập
const LOGIN_URL = 'pages/auth';

/**
 * Hàm kiểm tra xem người dùng đã đăng nhập hay chưa.
 * @param request NextRequest
 * @returns boolean
 */
function isAuthenticated(request: NextRequest): boolean {
  // GIẢ ĐỊNH: Bạn lưu token hoặc ID người dùng vào cookie khi đăng nhập.
  // HÃY ĐẢM BẢO TÊN COOKIE NÀY CHÍNH XÁC VỚI TÊN SUPABASE ĐANG DÙNG
  const sessionToken = request.cookies.get('supabase-auth-token'); 
  
  // Trả về true nếu tìm thấy token/cookie xác thực
  return !!sessionToken;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = isAuthenticated(request);
  
  // 1. Kiểm tra trang công khai (PUBLIC_PAGES)
  const isPublicPage = PUBLIC_PAGES.some(page => {
    // Xử lý cả trường hợp match chính xác và match tiền tố
    // VÍ DỤ: page='/room' sẽ match '/room', '/room/123', '/room/abc'
    return pathname === page || pathname.startsWith(`${page}/`);
  });

  // --- LOGIC BẢO VỆ ---
  
  if (isPublicPage) {
    // Nếu đã đăng nhập và đang cố truy cập trang ĐĂNG NHẬP/ĐĂNG KÝ
    if (loggedIn && pathname.startsWith(LOGIN_URL)) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/'; // Chuyển hướng về trang chính
      return NextResponse.redirect(homeUrl);
    }
    
    // Nếu chưa đăng nhập HOẶC đang truy cập trang công khai khác, cho phép đi tiếp.
    return NextResponse.next();
  } 
  
  // 2. Kiểm tra các trang yêu cầu ĐĂNG NHẬP (PRIVATE PAGES)
  if (!loggedIn) {
    // Nếu chưa đăng nhập và đang cố truy cập PRIVATE PAGE, chuyển hướng đến trang đăng nhập.
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_URL;
    return NextResponse.redirect(url);
  }

  // 3. Đã đăng nhập và truy cập PRIVATE PAGE, cho phép đi tiếp.
  return NextResponse.next();
}

// 2. Định nghĩa matcher
export const config = {
  matcher: [
    // Bỏ qua các đường dẫn tĩnh
    '/((?!api|_next/static|_next/image|favicon.ico|assets|images).*)',
  ],
};