# Đề 15 – Hệ thống Diễn đàn / Cộng đồng (Forum)

Ứng dụng diễn đàn trực tuyến cho phép người dùng đăng ký tài khoản, đăng nhập, tạo chủ đề thảo luận và bình luận. Hệ thống được triển khai bằng Docker Compose, sử dụng MySQL để lưu trữ dữ liệu, Nginx làm reverse proxy HTTPS và bộ công cụ Prometheus, Grafana, Loki, Promtail để giám sát hệ thống và tập trung log.

## 1. Thông tin đề tài

- **Đề tài:** Đề 15 – Diễn đàn / Cộng đồng (Forum)
- **Sinh viên:** Lý Văn Thuận
- **Mã đề:** 15
- **Repository:** https://github.com/luyenki2006/DTC245180005-lyvanthuan

### Yêu cầu chính

- Xây dựng website diễn đàn gồm người dùng, chủ đề và bình luận.
- Sử dụng MySQL làm cơ sở dữ liệu và phpMyAdmin để quản trị.
- Đưa ứng dụng lên Docker Compose.
- Cấu hình Nginx reverse proxy và HTTPS.
- Thu thập số liệu giám sát bằng Prometheus và hiển thị bằng Grafana.
- Thu thập log container bằng Promtail và lưu trữ, truy vấn bằng Loki.
- Thực hiện các biện pháp hardening phù hợp với môi trường triển khai.

## 2. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js 20, Express |
| Giao diện | EJS, HTML, CSS |
| Quản lý dữ liệu | Sequelize ORM |
| Cơ sở dữ liệu | MySQL 8.0 |
| Quản trị cơ sở dữ liệu | phpMyAdmin |
| Reverse proxy | Nginx Alpine |
| HTTPS | SSL/TLS, chứng chỉ tự ký |
| Container | Docker Compose |
| Metrics | Prometheus |
| Dashboard | Grafana |
| Lưu trữ log | Loki |
| Thu thập log | Promtail |
| Giám sát máy chủ | Node Exporter |
| Giám sát container | cAdvisor |
| Giám sát Nginx | Nginx Prometheus Exporter |
| Giám sát MySQL | MySQL Exporter |

## 3. Chức năng ứng dụng

### 3.1. Quản lý tài khoản

- Đăng ký tài khoản mới.
- Đăng nhập bằng tên đăng nhập và mật khẩu.
- Đăng xuất.
- Mã hóa mật khẩu bằng bcrypt.
- Quản lý phiên đăng nhập bằng express-session.

### 3.2. Quản lý chủ đề

- Xem danh sách chủ đề diễn đàn.
- Xem chi tiết một chủ đề.
- Tạo chủ đề mới khi đã đăng nhập.

### 3.3. Bình luận

- Xem bình luận của chủ đề.
- Đăng bình luận khi đã đăng nhập.

### 3.4. Kiểm tra trạng thái ứng dụng

Endpoint `/health` trả về trạng thái ứng dụng ở định dạng JSON.

Lưu ý: endpoint này kiểm tra phản hồi của ứng dụng; không nên xem đây là kiểm tra đầy đủ về tình trạng hoạt động của toàn bộ hệ thống hoặc cơ sở dữ liệu.

## 4. Kiến trúc hệ thống

```text
                         Người dùng
                             |
                    HTTP :80 / HTTPS :443
                             |
                         Nginx
                    Reverse Proxy HTTPS
                             |
                       Express App
                       Node.js :3000
                             |
                      Sequelize ORM
                             |
                         MySQL :3306
                             |
                        phpMyAdmin
                         Host :8080


 Docker Host / Containers
          |
          +---- Node Exporter --------+
          +---- cAdvisor -------------+
          +---- Nginx Exporter -------+---- Prometheus
          +---- MySQL Exporter -------+       |
                                              |
                                           Grafana
                                              |
                                       Dashboard Metrics

 Docker Container Logs
          |
       Promtail
          |
          v
         Loki
          |
       Grafana
       LogQL
```

Các thành phần giao tiếp với nhau thông qua mạng Docker bridge `forum-net`. MySQL không publish cổng 3306 trực tiếp ra host theo cấu hình Compose hiện tại.

## 5. Cấu trúc thư mục

```text
forum-project/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
├── public/
│   └── style.css
├── views/
│   ├── footer.ejs
│   ├── header.ejs
│   ├── login.ejs
│   ├── new-topic.ejs
│   ├── register.ejs
│   ├── topic-detail.ejs
│   └── topics.ejs
├── nginx/
│   ├── conf.d/
│   │   └── forum.conf
│   └── certs/
│       ├── forum.crt
│       └── forum.key
└── monitoring/
    ├── loki/
    │   └── loki-config.yml
    ├── mysql/
    │   └── exporter.cnf
    ├── prometheus/
    │   └── prometheus.yml
    └── promtail/
        └── promtail-config.yml
```

Không đưa `.env`, khóa riêng tư, file backup, dữ liệu database hoặc thông tin đăng nhập thật vào repository công khai. Cấu trúc trên mô tả các file chính của dự án; cần kiểm tra lại nội dung thực tế trước khi commit.

## 6. Các dịch vụ Docker Compose

| Dịch vụ | Container | Image | Cổng host |
|---|---|---|---|
| Ứng dụng | `forum-app` | `node:20` | `3000` |
| Nginx | `forum-nginx` | `nginx:alpine` | `80`, `443` |
| MySQL | `forum-mysql` | `mysql:8.0` | Không publish trực tiếp |
| phpMyAdmin | `forum-phpmyadmin` | `phpmyadmin/phpmyadmin:latest` | `8080` |
| Prometheus | `forum-prometheus` | `prom/prometheus:latest` | `127.0.0.1:9090` |
| Grafana | `forum-grafana` | `grafana/grafana:latest` | `3001` |
| Loki | `forum-loki` | `grafana/loki:3.5.1` | `127.0.0.1:3100` |
| Promtail | `forum-promtail` | `grafana/promtail:3.5.0` | Nội bộ Docker |
| Nginx Exporter | `forum-nginx-exporter` | `nginx/nginx-prometheus-exporter:1.4.2` | Nội bộ Docker |
| MySQL Exporter | `forum-mysql-exporter` | `prom/mysqld-exporter:v0.17.2` | Nội bộ Docker |
| Node Exporter | `forum-node-exporter` | `prom/node-exporter:latest` | Nội bộ Docker |
| cAdvisor | `forum-cadvisor` | `gcr.io/cadvisor/cadvisor:latest` | Nội bộ Docker |

Dữ liệu MySQL, Prometheus, Grafana, Loki và vị trí đọc log Promtail được lưu bằng named volumes theo cấu hình Docker Compose.

## 7. Cài đặt và chạy dự án

### 7.1. Yêu cầu

- Linux/Ubuntu hoặc môi trường hỗ trợ Docker.
- Docker Engine.
- Docker Compose plugin.
- Git.

Kiểm tra cài đặt:

```bash
docker --version
docker compose version
git --version
```

### 7.2. Lấy mã nguồn

```bash
git clone https://github.com/luyenki2006/DTC245180005-lyvanthuan.git forum-project
cd forum-project
```

Nếu mã nguồn đã có trên máy chủ, chuyển thẳng đến thư mục dự án.

### 7.3. Tạo file môi trường

```bash
cp .env.example .env
nano .env
```

Điền các biến môi trường với giá trị riêng của môi trường triển khai:

```dotenv
MYSQL_DATABASE=forum_db
MYSQL_USER=forum_user
MYSQL_PASSWORD=THAY_BANG_MAT_KHAU_MYSQL_MOI
MYSQL_ROOT_PASSWORD=THAY_BANG_MAT_KHAU_ROOT_MOI
SESSION_SECRET=THAY_BANG_CHUOI_NGAU_NHIEN_DAI
GRAFANA_ADMIN_PASSWORD=THAY_BANG_MAT_KHAU_GRAFANA_MOI
```

Tạo chuỗi bí mật cho phiên đăng nhập bằng:

```bash
openssl rand -hex 32
```

Sao chép kết quả vào `SESSION_SECRET`. Không sử dụng nguyên các giá trị minh họa trong file `.env.example`.

### 7.4. Cấu hình MySQL Exporter

Mở file:

```bash
nano monitoring/mysql/exporter.cnf
```

Cấu hình tài khoản MySQL dành cho exporter. Ví dụ:

```ini
[client]
user=forum_user
password=THAY_BANG_MAT_KHAU_MYSQL_MOI
host=mysql
port=3306
```

Mật khẩu phải khớp với tài khoản MySQL thực tế. Để triển khai bảo mật hơn, nên tạo tài khoản giám sát riêng với quyền tối thiểu cần thiết, thay vì dùng tài khoản ứng dụng.

Đảm bảo file chứa thông tin xác thực không bị commit lên GitHub.

### 7.5. Chuẩn bị chứng chỉ HTTPS

Nginx đang sử dụng hai file:

```text
nginx/certs/forum.crt
nginx/certs/forum.key
```

Tên máy chủ trong cấu hình hiện tại là `192.168.80.128`. Nếu IP của máy Ubuntu thay đổi, hãy cập nhật `server_name` và tạo chứng chỉ phù hợp với địa chỉ truy cập mới.

Chứng chỉ tự ký phù hợp cho môi trường học tập, thực hành. Trình duyệt có thể hiển thị cảnh báo vì chứng chỉ không được tổ chức phát hành chứng chỉ công khai tin cậy xác thực.

Không commit file khóa riêng tư lên repository công khai.

### 7.6. Khởi động hệ thống

Sau khi đã cấu hình `.env`, exporter và chứng chỉ:

```bash
docker compose config
docker compose up -d
docker compose ps
```

Xem log nếu dịch vụ gặp lỗi:

```bash
docker compose logs --tail=100 app
docker compose logs --tail=100 nginx
docker compose logs --tail=100 mysql
docker compose logs --tail=100 prometheus
docker compose logs --tail=100 grafana
docker compose logs --tail=100 loki
docker compose logs --tail=100 promtail
```

Không chạy `docker compose down -v` nếu cần giữ dữ liệu trong các named volumes.

**Lưu ý về mật khẩu:** khi MySQL đã khởi tạo dữ liệu trong volume, việc thay đổi `MYSQL_PASSWORD` trong `.env` không tự động thay đổi mật khẩu của tài khoản đã tồn tại. Tương tự, Grafana có thể lưu mật khẩu quản trị trong volume dữ liệu. Hãy cập nhật tài khoản thực tế theo quy trình phù hợp thay vì chỉ sửa biến môi trường.

## 8. Truy cập hệ thống

Với máy Ubuntu đang sử dụng IP `192.168.80.128`:

| Thành phần | Địa chỉ |
|---|---|
| Website qua HTTPS | `https://192.168.80.128` |
| Website qua HTTP | `http://192.168.80.128` — chuyển hướng sang HTTPS |
| phpMyAdmin | `http://192.168.80.128:8080` |
| Grafana | `http://192.168.80.128:3001` |
| Prometheus | `http://127.0.0.1:9090` trên máy Ubuntu |
| Loki API | `http://127.0.0.1:3100` trên máy Ubuntu |

Các địa chỉ trên giả định máy chủ vẫn sử dụng IP đã cấu hình trong Nginx. Nếu truy cập từ máy khác, thay `127.0.0.1` bằng cách truy cập phù hợp hoặc dùng SSH tunnel.

### Tài khoản truy cập

- **Diễn đàn:** người dùng tự đăng ký qua trang đăng ký.
- **phpMyAdmin:** đăng nhập bằng tài khoản MySQL phù hợp.
- **Grafana:** tài khoản quản trị được cấu hình qua biến môi trường; mật khẩu có thể đã được lưu trong volume khi khởi tạo lần đầu.

Không ghi mật khẩu thật vào README.

## 9. Giám sát với Prometheus

Prometheus được cấu hình scrape theo chu kỳ 15 giây.

Các job được khai báo trong `monitoring/prometheus/prometheus.yml`:

| Job | Target |
|---|---|
| `prometheus` | `prometheus:9090` |
| `nginx` | `nginx-exporter:9113` |
| `mysql` | `mysql-exporter:9104` |
| `node` | `node-exporter:9100` |
| `cadvisor` | `cadvisor:8080` |

Kiểm tra trạng thái target trên trang Prometheus:

```text
http://127.0.0.1:9090/targets
```

Các target cần ở trạng thái `UP` để xác nhận Prometheus đang thu thập dữ liệu từ exporter tương ứng.

Việc khai báo job không tự đảm bảo tất cả target đều hoạt động. Cần kiểm tra thực tế trên trang Targets sau khi khởi động hệ thống.

## 10. Dashboard Grafana

Grafana cung cấp giao diện trực quan để theo dõi dữ liệu giám sát.

Địa chỉ mặc định theo cấu hình:

```text
http://192.168.80.128:3001
```

Để xem dữ liệu Prometheus hoặc log Loki, cần cấu hình datasource tương ứng trong Grafana nếu chưa được thiết lập.

Các nội dung có thể xây dựng thành dashboard:

- CPU, bộ nhớ và tài nguyên máy chủ.
- Tình trạng hoạt động của container.
- Metrics từ Nginx.
- Metrics từ MySQL.
- Trạng thái thu thập dữ liệu của Prometheus.

Chỉ mô tả dashboard và datasource là đã hoàn thành sau khi xác nhận chúng hoạt động thực tế.

## 11. Thu thập log bằng Promtail và Loki

Promtail được cấu hình đọc log container Docker từ:

```text
/var/lib/docker/containers/*/*-json.log
```

Log được gửi đến Loki qua endpoint nội bộ:

```text
http://loki:3100/loki/api/v1/push
```

Loki sử dụng filesystem storage, schema `v13`, TSDB và lưu dữ liệu trong volume `forum_loki_data`.

### Truy vấn LogQL

Sau khi cấu hình Loki làm datasource trong Grafana, có thể thử các truy vấn sau trong Explore:

Lọc log theo job:

```logql
{job="docker"}
```

Lọc log theo container nếu nhãn `container` có tồn tại:

```logql
{job="docker", container=~".*forum-app.*"}
```

Tìm log có nội dung lỗi:

```logql
{job="docker"} |= "error"
```

Các truy vấn chỉ trả về dữ liệu nếu log đã được Promtail thu thập và nhãn tương ứng có trong dữ liệu thực tế.

## 12. Nginx reverse proxy và HTTPS

Nginx thực hiện các nhiệm vụ:

- Chuyển hướng HTTP cổng 80 sang HTTPS cổng 443.
- Chuyển tiếp yêu cầu đến ứng dụng tại `http://app:3000`.
- Chuyển tiếp các header `Host`, `X-Real-IP`, `X-Forwarded-For` và `X-Forwarded-Proto`.
- Sử dụng TLS 1.2 và TLS 1.3.
- Thêm các header bảo mật `X-Content-Type-Options`, `X-Frame-Options` và `Referrer-Policy`.
- Cung cấp endpoint `/nginx_status` cho Nginx Exporter, với giới hạn địa chỉ được phép truy cập theo cấu hình.

Nginx là lớp reverse proxy, nhưng cấu hình Compose hiện tại cũng publish cổng `3000` của ứng dụng trực tiếp lên host. Vì vậy, nếu muốn buộc mọi truy cập website đi qua HTTPS, cần cân nhắc bỏ phần publish cổng ứng dụng ra host và chỉ giữ kết nối nội bộ Docker.

## 13. Hardening và lưu ý bảo mật

Các cấu hình hiện có gồm:

- Sử dụng HTTPS ở Nginx.
- Có một số HTTP security headers.
- Sử dụng session cookie với `httpOnly`, `sameSite=lax` và thời hạn phiên.
- Mật khẩu người dùng được băm bằng bcrypt.
- MySQL không publish cổng 3306 ra host.
- Prometheus và Loki chỉ bind cổng host vào loopback.
- File `.env` được loại trừ khỏi Git qua `.gitignore`.

Các biện pháp cần kiểm tra hoặc cải thiện trước khi triển khai công khai:

1. Không lưu mật khẩu, khóa riêng tư hoặc thông tin xác thực thật trong Git.
2. Bổ sung quy tắc loại trừ file khóa TLS, ví dụ `nginx/certs/*.key`.
3. Nếu bí mật từng được commit, hãy thay bí mật và xử lý lịch sử Git phù hợp; chỉ thêm `.gitignore` không xóa nội dung đã commit.
4. Giới hạn quyền truy cập phpMyAdmin, Grafana và các cổng quản trị.
5. Cân nhắc bỏ publish trực tiếp cổng `3000` của ứng dụng.
6. Dùng tài khoản giám sát MySQL có quyền tối thiểu.
7. Đánh giá cấu hình `privileged` và các mount hệ thống của cAdvisor.
8. Xây dựng quy trình backup và khôi phục dữ liệu MySQL.
9. Cân nhắc ghim phiên bản image thay vì sử dụng `latest` cho các dịch vụ đang dùng tag này.
10. Bổ sung kiểm thử ứng dụng và quy trình cập nhật an toàn.

Các điểm trên là danh sách hardening và khuyến nghị; không có nghĩa tất cả đã được thực hiện.

## 14. Các lệnh quản trị thường dùng

Kiểm tra dịch vụ:

```bash
docker compose ps
```

Theo dõi log trực tiếp:

```bash
docker compose logs -f app
docker compose logs -f nginx
docker compose logs -f prometheus
docker compose logs -f promtail
docker compose logs -f loki
```

Khởi động lại một dịch vụ:

```bash
docker compose restart app
```

Khởi động lại toàn bộ dịch vụ:

```bash
docker compose restart
```

Kiểm tra cấu hình Compose:

```bash
docker compose config
```

Dừng dịch vụ nhưng giữ lại named volumes:

```bash
docker compose down
```

Khởi động lại:

```bash
docker compose up -d
```

## 15. Kiểm tra trước khi nộp bài

- [ ] Website đăng ký và đăng nhập được.
- [ ] Tạo chủ đề và đăng bình luận được.
- [ ] Dữ liệu được lưu trong MySQL.
- [ ] phpMyAdmin kết nối được với MySQL.
- [ ] Nginx chuyển HTTP sang HTTPS.
- [ ] Prometheus truy cập được và các target cần thiết ở trạng thái `UP`.
- [ ] Grafana truy vấn được metrics Prometheus.
- [ ] Promtail gửi log đến Loki.
- [ ] Truy vấn LogQL trả về log thực tế.
- [ ] Không công khai `.env`, mật khẩu, khóa riêng tư hoặc dữ liệu backup.
- [ ] README và các file cấu hình trong GitHub khớp với hệ thống đang triển khai.

---

**Repository:** https://github.com/luyenki2006/DTC245180005-lyvanthuan

**Đề tài:** Đề 15 – Diễn đàn / Cộng đồng (Forum)

**Sinh viên:** Lý Văn Thuận

