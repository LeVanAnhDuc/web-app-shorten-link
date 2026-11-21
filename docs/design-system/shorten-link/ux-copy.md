# UX copy — Shorten Link

## Voice

Plain, short, practical — the app is a tool people use for ten seconds. Write what happens, not how
it works inside. Sentence case. No exclamation marks, no apologies, no jokes in errors.

- **Name actions by their result, and keep the name through the flow.** The button says "Shorten";
  the result is "your short link". The button says "Copy"; the confirmation says "Copied".
- **Errors say what went wrong and what to do.** Never "Something went wrong" alone.
- **Empty states invite the next action.**
- English is the default locale; Vietnamese is written natively, not word-for-word.
- Use "link", not "URL", in UI copy (except where a field needs a technical hint).

## Strings (i18n keys → `en` / `vi`)

| Key | en | vi |
| --- | --- | --- |
| `home.title` | Shorten a link | Rút gọn link |
| `home.subtitle` | Paste a long link and get a short one with a QR code. No account needed. | Dán link dài, nhận link ngắn kèm mã QR. Không cần tài khoản. |
| `home.subtitleNoQr` | Paste a long link and get a short one. No account needed. | Dán link dài, nhận link ngắn. Không cần tài khoản. |
| `app.skipToMain` | Skip to main content | Bỏ qua, tới nội dung chính |
| `features.heading` | What you get | Bạn nhận được gì |
| `form.url.label` | Long link | Link dài |
| `form.url.hint` | Starts with http:// or https:// | Bắt đầu bằng http:// hoặc https:// |
| `form.alias.toggle` | Choose your own ending | Tự đặt đuôi link |
| `form.alias.label` | Custom ending (optional) | Đuôi tuỳ chọn (không bắt buộc) |
| `form.alias.hint` | 3–32 letters, numbers, - or _ | 3–32 ký tự: chữ, số, - hoặc _ |
| `form.submit` | Shorten | Rút gọn |
| `form.submitting` | Shortening… | Đang rút gọn… |
| `result.heading` | Your short link | Link ngắn của bạn |
| `result.original` | Original | Link gốc |
| `action.copy` | Copy | Sao chép |
| `action.copied` | Copied | Đã sao chép |
| `action.open` | Open | Mở |
| `action.showQr` | Show QR code | Hiện mã QR |
| `action.downloadQr` | Download QR code | Tải mã QR |
| `action.remove` | Remove | Xoá |
| `action.undo` | Undo | Hoàn tác |
| `action.refresh` | Refresh clicks | Cập nhật lượt click |
| `history.heading` | Your links | Link của bạn |
| `history.note` | Saved in this browser only. | Chỉ lưu trên trình duyệt này. |
| `history.empty` | Links you shorten will show up here. | Link bạn rút gọn sẽ hiện ở đây. |
| `history.clicks` | {count} click \| {count} clicks | {count} lượt click |
| `history.removed` | Removed from your links. The short link still works. | Đã xoá khỏi danh sách. Link ngắn vẫn hoạt động. |
| `features.qr` | A QR code comes with every link | Link nào cũng kèm mã QR |
| `features.alias` | Pick a custom ending if you like | Có thể tự đặt đuôi link |
| `features.anonymous` | No sign-up, no account | Không cần đăng ký |
| `error.url.required` | Paste a link to shorten. | Hãy dán link cần rút gọn. |
| `error.url.invalid` | That doesn't look like a web link. Check it starts with http:// or https://. | Link này không hợp lệ. Kiểm tra link bắt đầu bằng http:// hoặc https://. |
| `error.alias.format` | Use 3–32 letters, numbers, - or _. | Dùng 3–32 ký tự: chữ, số, - hoặc _. |
| `error.alias.reserved` | That ending is reserved. Try another one. | Đuôi này đã được dành riêng. Hãy chọn đuôi khác. |
| `error.alias.taken` | That ending is already in use. Try another one. | Đuôi này đã có người dùng. Hãy chọn đuôi khác. |
| `error.rateLimited` | You've shortened a lot of links. Try again in {seconds} seconds. | Bạn đã rút gọn nhiều link. Thử lại sau {seconds} giây. |
| `error.network` | Couldn't reach the server. Check your connection and try again. | Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại. |
| `error.copy` | Couldn't copy. Select the link and copy it manually. | Không sao chép được. Hãy chọn link và sao chép thủ công. |
| `notFound.title` | This short link doesn't exist | Link ngắn này không tồn tại |
| `notFound.body` | Check the link for typos, or shorten a new one. | Kiểm tra lại link, hoặc rút gọn link mới. |
| `notFound.action` | Shorten a link | Rút gọn link |
| `a11y.copyCode` | Copy short link {code} | Sao chép link ngắn {code} |
| `a11y.openCode` | Open short link {code} in a new tab | Mở link ngắn {code} trong tab mới |
| `a11y.removeCode` | Remove {code} from your links | Xoá {code} khỏi danh sách |
| `a11y.created` | Short link created: {shortUrl} | Đã tạo link ngắn: {shortUrl} |
| `a11y.qrAlt` | QR code for {shortUrl} | Mã QR của {shortUrl} |
| `theme.toDark` | Switch to dark theme | Chuyển sang giao diện tối |
| `theme.toLight` | Switch to light theme | Chuyển sang giao diện sáng |
| `lang.switch` | Tiếng Việt | English |
