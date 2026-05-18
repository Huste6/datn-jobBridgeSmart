# Sơ đồ: Chiến lược Auto-scaling với HPA và PDB

## Mục đích
Minh họa cơ chế HPA tự động scale Pod theo CPU và PDB bảo vệ tính sẵn sàng khi Rolling Update.

## Mô tả sơ đồ (dùng để gen ảnh)

Vẽ sơ đồ kỹ thuật theo chiều ngang, nền trắng, phong cách kiến trúc hệ thống (technical architecture).

### Phần 1 — HPA Auto-scaling (nửa trên)

**Tiêu đề:** "Horizontal Pod Autoscaler (HPA) — Scale theo CPU"

Bố cục từ trái sang phải:

```
[Metrics Server]
   ↓ CPU metrics (mỗi 15s)
[HPA Controller]
   ├─── CPU < 70%  → Giữ nguyên hoặc scale-in (giảm replica)
   └─── CPU ≥ 70%  → Scale-out (tăng replica, tối đa 5)
          ↓
   [Kubernetes Scheduler]
          ↓
   [Tạo Pod mới trên Node]
```

**Bảng ngưỡng** (vẽ ngay trong sơ đồ hoặc bên cạnh):
| Service | Min | Max | CPU Threshold |
|---------|-----|-----|---------------|
| Gateway / Auth / Jobs | 1 | 5 | 70% |
| AI Service / Frontend | 1 | 3 | 75% |

**Minh họa trực quan:** Vẽ 2 cụm Pod trước và sau khi scale:
- Trước: 1 Pod (CPU 85% — màu đỏ/cam)
- Sau scale-out: 3 Pod (CPU 28% mỗi cái — màu xanh)

---

### Phần 2 — PDB Protection (nửa dưới)

**Tiêu đề:** "Pod Disruption Budget (PDB) — Bảo vệ khi Rolling Update"

Vẽ timeline theo chiều ngang:

```
TRẠNG THÁI BAN ĐẦU:
[Pod v1] [Pod v1] [Pod v1]  ← 3 Pod đang chạy

ROLLING UPDATE (KHÔNG có PDB):
[  xóa  ] [  xóa  ] [Pod v2]  ← Có thể xóa nhiều Pod cùng lúc → Downtime!

ROLLING UPDATE (CÓ PDB minAvailable=1):
[Pod v1] → [Pod v2]           ← Chỉ xóa 1 Pod khi Pod mới Ready
          [Pod v1] → [Pod v2]
                   [Pod v1] → [Pod v2]
→ Luôn có ít nhất 1 Pod healthy phục vụ traffic
```

**Chú thích:** "PDB đảm bảo Zero-downtime trong mọi chu kỳ triển khai"

---

## Màu sắc gợi ý
- Nền: trắng (#FFFFFF)
- HPA Controller: xanh dương (#2563EB)
- Pod healthy: xanh lá (#16A34A)
- Pod CPU cao / xóa: đỏ cam (#DC2626)
- Pod đang tạo: vàng (#CA8A04)
- Mũi tên: xám đậm (#374151)
- Box tiêu đề: gradient nhẹ từ xanh dương sang tím

## Kích thước đề xuất
- Tỉ lệ: 16:9 hoặc 4:3
- Độ rộng tối thiểu: 1200px để rõ chữ khi in
- Font: Inter hoặc Roboto, size 12-14px cho body

## Tên file output
`hpa_pdb_autoscaling.png`
