# Đồ án: Hệ thống Diễn đàn & Giám sát Containerized (Đề 15)

Hệ thống diễn đàn (Forum) triển khai trên nền tảng Docker Compose, tích hợp Nginx Reverse Proxy, hệ thống giám sát Prometheus + Grafana, và quản lý log tập trung với Loki + Promtail.

## 1. Thành phần Hệ thống
- **Web App**: Node.js (Port 3000)
- **Reverse Proxy**: Nginx (Port 80/443)
- **Database**: MySQL 8.0 & phpMyAdmin (Port 8080)
- **Monitoring**: Prometheus (Port 9090) & Grafana (Port 3001)
- **Logging**: Loki & Promtail
- **Exporters**: Node-exporter, MySQL-exporter, Nginx-exporter, cAdvisor

## 2. Hướng dẫn Triển khai

### Yêu cầu tiên quyết
- Docker & Docker Compose đã được cài đặt.

### Các bước khởi chạy
1. Clone repository về máy:
   ```bash
   git clone <LINK_GITHUB_REPO_CỦA_BẠN>
   cd forum-project
