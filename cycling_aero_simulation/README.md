# Mô phỏng Khí động học (CFD) & Công suất Xe đạp đua Carbon bằng FEniCS

Dự án mô phỏng số học giải hệ phương trình **Navier-Stokes** (Computational Fluid Dynamics - CFD) bằng thư viện **FEniCS** và tính toán công suất cơ học chuyển động đường trường (Road Cycling Dynamics) cho xe đạp đua chuyên nghiệp.

---

## 🎯 Bài toán đặt ra

* **Vận tốc xe đạp ($v$):** $40 \text{ km/h} = 11.111 \text{ m/s}$.
* **Vận tốc gió ngược ($v_w$):** $3 \text{ km/h} = 0.833 \text{ m/s}$.
* **Vận tốc gió biểu kiến ($v_{\text{rel}}$):** $43 \text{ km/h} = 11.944 \text{ m/s}$.
* **Độ dốc mặt đường ($s$):** $5\%$ ($\theta \approx 2.862^\circ$).
* **Khối lượng toàn hệ thống ($m_{\text{total}}$):** $81.0 \text{ kg}$ (Vận động viên $72 \text{ kg}$ + Xe đạp đua Carbon cao cấp $7.5 \text{ kg}$ + Quần áo/giày/bình nước $1.5 \text{ kg}$).
* **Hệ số cản lăn lốp đua ($C_{rr}$):** $0.0035$ (Lốp đua Continental GP5000 / Pirelli P Zero Race trên đường nhựa mịn).
* **Môi trường không khí:** Mật độ $\rho = 1.205 \text{ kg/m}^3$, độ nhớt động học $\nu = 1.5 \times 10^{-5} \text{ m}^2/\text{s}$.
* **Hiệu suất truyền động xích/líp ($\eta$):** $97\%$ (Hao phí cơ học $3\%$).

---

## 📐 Mô hình toán học & Phương pháp phần tử hữu hạn (FEniCS)

### 1. Phương trình dòng chảy Navier-Stokes
Giải hệ phương trình Navier-Stokes trạng thái ổn định cho dòng chảy không nén:
$$\rho (\mathbf{u} \cdot \nabla)\mathbf{u} = -\nabla p + \mu_{\text{eff}} \nabla^2 \mathbf{u}$$
$$\nabla \cdot \mathbf{u} = 0$$

* **Không gian hàm Taylor-Hood:** $P_2 - P_1$ (Vận tốc bậc 2, Áp suất bậc 1).
* **Bộ giải số:** Khởi tạo trường dòng chảy bằng bài toán Stokes tuyến tính, sau đó lặp phi tuyến Oseen/Picard với suy giảm (under-relaxation) kết hợp bộ giải trực tiếp **MUMPS**.
* **Điều kiện biên:**
  * Inflow ($x = -1.5\text{m}$): $\mathbf{u} = (11.944, 0) \text{ m/s}$.
  * Outflow ($x = 4.0\text{m}$): $p = 0$.
  * Tường hầm gió: Trượt tự do $u_y = 0$.
  * Bề mặt xe và người đạp ($\Gamma_{\text{bike}}$): Bám dính không trượt (No-slip) $\mathbf{u} = \mathbf{0}$.

### 2. Mô hình tính công suất tổng cộng
$$P_{\text{rider}} = \frac{P_{\text{gravity}} + P_{\text{aero}} + P_{\text{rolling}}}{\eta_{\text{drivetrain}}}$$

Trong đó:
* $P_{\text{gravity}} = m \cdot g \cdot \sin(\theta) \cdot v$
* $P_{\text{aero}} = F_{\text{drag}} \cdot v = \frac{1}{2} \rho (C_d A) v_{\text{rel}}^2 \cdot v$
* $P_{\text{rolling}} = C_{rr} \cdot m \cdot g \cdot \cos(\theta) \cdot v$

---

## 📊 Kết quả tính toán chi tiết

| Thành phần cản | Lực cản (Newton) | Công suất tiêu thụ (Watts) | Tỷ lệ (%) |
| :--- | :---: | :---: | :---: |
| **1. Thắng trọng lực (Dốc 5%)** | **39.67 N** | **440.8 W** | **57.9%** |
| **2. Cản gió khí động học (CFD)** | **24.08 N** | **267.6 W** | **35.1%** |
| **3. Ma sát lăn của lốp xe** | **2.78 N** | **30.9 W** | **4.1%** |
| **4. Hao phí cơ học truyền động (3%)** | - | **22.6 W** | **3.0%** |
| **★ TỔNG CÔNG SUẤT NGƯỜI ĐẠP** | **66.53 N** | **761.88 WATT** | **100.0%** |

* **Tỷ số công suất / trọng lượng (W/kg):** **10.58 W/kg**.

> 💡 **Nhận xét chuyên môn:** 
> Duy trì vận tốc **40 km/h** trên một con **dốc 5%** có gió ngược đòi hỏi tới **~762 Watt**. Đây là mức công suất thuộc ngưỡng **Anaerobic Sprint** (nước rút kịch khung) của các tay đua World Tour (như Tadej Pogačar hay Mathieu van der Poel) và chỉ có thể duy trì trong khoảng **30 – 60 giây**. 
> Để leo dốc 5% bền bỉ (ngưỡng FTP khoảng 350 - 400W), vận tốc thực tế của tay đua chuyên nghiệp thường nằm trong khoảng **25 – 28 km/h**.

---

## 🚀 Cách chạy mô phỏng lại

```bash
cd ~/Hackathon-Rmit-2026/cycling_aero_simulation
python3 simulate_cycling_aero.py
```

Kết quả biểu đồ và file trực quan hóa ParaView được xuất tại thư mục `output/`:
* `output/cycling_power_analysis.png`: Biểu đồ cơ cấu công suất, lực cản và đường cong quan hệ $P - v$.
* `output/cyclist_velocity_field.png`: Phân bố trường vận tốc không khí quanh xe đạp.
* `output/velocity.pvd` & `output/pressure.pvd`: Mở trực tiếp trong phần mềm **ParaView** để xem 3D vector trường dòng.
