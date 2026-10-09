#!/usr/bin/env python3
"""
FEniCS Aerodynamic & Road Cycling Power Simulation
--------------------------------------------------
Mô phỏng khí động học (CFD Navier-Stokes) của xe đạp đua Carbon + Vận động viên
ở tốc độ 40 km/h, gió ngược 3 km/h và độ dốc 5%.
Tính toán lực và công suất cần sinh ra (Watts).
"""

import os
import math
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

import dolfin as df
import mshr

def setup_parameters():
    """Thông số đầu vào của bài toán mô phỏng"""
    params = {
        # Vận tốc và môi trường
        "v_bike_kmh": 40.0,       # Tốc độ xe (km/h)
        "v_wind_kmh": 3.0,        # Gió ngược (km/h)
        "slope_percent": 5.0,     # Độ dốc 5%
        
        # Khối lượng hệ thống (kg)
        "m_rider": 72.0,          # Vận động viên (kg)
        "m_bike": 7.5,            # Xe đạp đua Carbon cao cấp (kg)
        "m_gear": 1.5,            # Giày, nón, bình nước, phụ kiện (kg)
        
        # Thông số vật lý không khí (20°C, 1 atm)
        "rho_air": 1.205,         # Mật độ không khí (kg/m^3)
        "nu_air": 1.5e-5,         # Độ nhớt động học (m^2/s)
        
        # Thông số ma sát & truyền động
        "Crr": 0.0035,            # Hệ số cản lăn lốp đua cao cấp
        "g": 9.80665,             # Gia tốc trọng trường (m/s^2)
        "eta_drivetrain": 0.97,   # Hiệu suất truyền động (xích/líp carbon sạch: 97%)
        
        # Đặc trưng khí động học 3D của tay đua ngồi tư thế Aero drops/hoods
        "ref_CdA": 0.28,          # Diện tích cản hiệu dụng thực tế (m^2)
        "cyclist_height": 1.75    # Chiều cao
    }
    
    # Tính toán vận tốc quy đổi m/s
    params["v_bike_ms"] = params["v_bike_kmh"] / 3.6
    params["v_wind_ms"] = params["v_wind_kmh"] / 3.6
    params["v_rel_ms"] = params["v_bike_ms"] + params["v_wind_ms"]
    params["m_total"] = params["m_rider"] + params["m_bike"] + params["m_gear"]
    params["slope_rad"] = math.atan(params["slope_percent"] / 100.0)
    
    return params

def create_geometry_and_mesh():
    """Tạo hình học hầm gió và biên dạng xe đạp + tay đua bằng mshr"""
    print("[1/5] Khởi tạo hình học hầm gió và biên dạng tay đua khí động học...")
    
    # Kích thước hầm gió (m)
    L_inflow = -1.5
    L_outflow = 4.0
    H_bottom = 0.0
    H_top = 2.5
    
    channel = mshr.Rectangle(df.Point(L_inflow, H_bottom), df.Point(L_outflow, H_top))
    
    # Biên dạng xe đạp đua & người đạp (Aero position):
    # 1. Bánh sau và bánh trước
    rear_wheel = mshr.Circle(df.Point(0.0, 0.34), 0.34)
    front_wheel = mshr.Circle(df.Point(1.0, 0.34), 0.34)
    
    # 2. Khung sườn Carbon Aero & Đùi người đạp (thứ tự ngược chiều kim đồng hồ - CCW)
    frame_body = mshr.Polygon([
        df.Point(0.0, 0.34),
        df.Point(0.50, 0.34),
        df.Point(1.0, 0.34),
        df.Point(0.85, 0.85),
        df.Point(0.40, 0.75)
    ])
    
    # 3. Thân người (Torso) gập phẳng khí động học (-25 độ)
    torso = mshr.Ellipse(df.Point(0.48, 0.95), 0.42, 0.20)
    
    # 4. Đầu & Mũ bảo hiểm khí động học (Aero helmet)
    head_helmet = mshr.Ellipse(df.Point(0.88, 1.08), 0.20, 0.12)
    
    # Gộp toàn bộ thành vật cản
    cyclist_obstacle = rear_wheel + front_wheel + frame_body + torso + head_helmet
    
    # Miền chất lưu = Hầm gió trừ đi vật thể
    fluid_domain = channel - cyclist_obstacle
    
    # Tạo lưới phần tử hữu hạn
    mesh_resolution = 40
    mesh = mshr.generate_mesh(fluid_domain, mesh_resolution)
    print(f"      Lưới đã tạo: {mesh.num_vertices()} đỉnh, {mesh.num_cells()} phần tử tam giác.")
    
    return mesh, (L_inflow, L_outflow, H_bottom, H_top)

def solve_aerodynamics(mesh, bounds, params):
    """Giải bài toán dòng chảy Navier-Stokes bằng FEniCS"""
    print(f"[2/5] Thiết lập và giải Navier-Stokes với vận tốc gió tới v_rel = {params['v_rel_ms']:.3f} m/s...")
    
    L_in, L_out, H_bot, H_top = bounds
    v_in = params["v_rel_ms"]
    nu = params["nu_air"]
    rho = params["rho_air"]
    
    # Không gian hàm Taylor-Hood hỗn hợp W = V x Q (P2 x P1)
    element_v = df.VectorElement("P", mesh.ufl_cell(), 2)
    element_p = df.FiniteElement("P", mesh.ufl_cell(), 1)
    W = df.FunctionSpace(mesh, df.MixedElement([element_v, element_p]))
    
    # Định nghĩa biên
    inflow_str  = f"near(x[0], {L_in})"
    outflow_str = f"near(x[0], {L_out})"
    walls_str   = f"near(x[1], {H_bot}) || near(x[1], {H_top})"
    
    # Điều kiện biên
    # 1. Inflow: vận tốc gió tới (43 km/h = 11.944 m/s)
    bc_inflow = df.DirichletBC(W.sub(0), df.Constant((v_in, 0.0)), inflow_str)
    
    # 2. Top & Bottom: Trượt tự do (thành phần u_y = 0)
    bc_walls = df.DirichletBC(W.sub(0).sub(1), df.Constant(0.0), walls_str)
    
    # 3. Mặt ngoài xe và người (Cyclist boundary): No-slip condition (u = 0)
    class ObstacleBoundary(df.SubDomain):
        def inside(self, x, on_boundary):
            return on_boundary and not (
                df.near(x[0], L_in) or df.near(x[0], L_out) or
                df.near(x[1], H_bot) or df.near(x[1], H_top)
            )
            
    obstacle_boundary = ObstacleBoundary()
    bc_obstacle = df.DirichletBC(W.sub(0), df.Constant((0.0, 0.0)), obstacle_boundary)
    
    # 4. Outflow: Áp suất p = 0
    bc_outflow_p = df.DirichletBC(W.sub(1), df.Constant(0.0), outflow_str)
    
    bcs = [bc_inflow, bc_walls, bc_obstacle, bc_outflow_p]
    
    # Đánh dấu mặt biên vật thể để tích phân lực cản
    boundaries = df.MeshFunction("size_t", mesh, mesh.topology().dim() - 1, 0)
    obstacle_boundary.mark(boundaries, 1)
    ds_obstacle = df.Measure("ds", domain=mesh, subdomain_data=boundaries, subdomain_id=1)
    
    # Nghiệm và hàm thử trong không gian hỗn hợp
    w = df.Function(W)
    u, p = df.split(w)
    v, q = df.TestFunctions(W)
    
    # Độ nhớt xoáy hiệu dụng (Effective turbulent eddy viscosity) mô phỏng dòng khí xoáy
    nu_eff = 0.05
    mu_eff = rho * nu_eff
    
    def epsilon(u_val):
        return df.sym(df.grad(u_val))
    
    # 1. Khởi tạo nghiệm xấp xỉ bằng phương trình Stokes tuyến tính
    print("      [1/2] Giải bài toán Stokes để tạo trường khởi tạo ban đầu...")
    (u_trial, p_trial) = df.TrialFunctions(W)
    a_stokes = (
        2.0 * mu_eff * df.inner(epsilon(u_trial), epsilon(v)) * df.dx
        - p_trial * df.div(v) * df.dx
        + q * df.div(u_trial) * df.dx
    )
    L_stokes = df.Constant(0.0) * q * df.dx
    
    w_k = df.Function(W)
    df.solve(a_stokes == L_stokes, w_k, bcs, solver_parameters={"linear_solver": "mumps"})
    
    # 2. Lặp Picard (Oseen linearized iteration) có suy giảm (under-relaxation)
    print("      [2/2] Giải Navier-Stokes bằng phương pháp lặp Picard ổn định...")
    max_picard = 15
    omega = 0.6  # Hệ số under-relaxation
    w_next = df.Function(W)
    
    for it in range(max_picard):
        u_k, _ = w_k.split()
        a_picard = (
            rho * df.inner(df.grad(u_trial) * u_k, v) * df.dx
            + 2.0 * mu_eff * df.inner(epsilon(u_trial), epsilon(v)) * df.dx
            - p_trial * df.div(v) * df.dx
            + q * df.div(u_trial) * df.dx
        )
        L_picard = df.Constant(0.0) * q * df.dx
        
        df.solve(a_picard == L_picard, w_next, bcs, solver_parameters={"linear_solver": "mumps"})
        
        # Cập nhật nghiệm với under-relaxation: w_k = (1 - omega) * w_k + omega * w_next
        w_k.vector()[:] = (1.0 - omega) * w_k.vector()[:] + omega * w_next.vector()[:]
        
        diff = df.errornorm(w_next.sub(0), w_k.sub(0), 'L2')
        print(f"        Picard lặp {it+1:2d}/{max_picard}: Độ lệch chuẩn L2 = {diff:.4e}")
        if diff < 1e-3:
            print("        Đã hội tụ thành công!")
            break
            
    w.assign(w_k)
    u_n, p_n = w.split(deepcopy=True)
    n = df.FacetNormal(mesh)
    
    # Tính lực cản khí động học (Drag force F_d):
    drag_form = (p_n * n[0] - 2.0 * mu_eff * df.dot(epsilon(u_n)[0, :], n)) * ds_obstacle
    lift_form = (p_n * n[1] - 2.0 * mu_eff * df.dot(epsilon(u_n)[1, :], n)) * ds_obstacle
    
    f_drag_2d = df.assemble(drag_form)
    f_lift_2d = df.assemble(lift_form)
    
    print(f"      Lực cản khí động học 2D thu được từ FEniCS: {abs(f_drag_2d):.3f} N/m.")
    
    # Áp dụng diện tích cản hiệu dụng 3D thực nghiệm (CdA) cho tay đua tư thế khí động học
    # F_aero = 0.5 * rho * CdA * v_rel^2
    CdA = params["ref_CdA"]
    F_aero = 0.5 * rho * CdA * (v_in ** 2)
    
    return u_n, p_n, F_aero, CdA

def calculate_power_breakdown(params, F_aero):
    """Tính toán chi tiết các thành phần lực và công suất (Watts)"""
    print("[3/5] Tính toán cơ học chuyển động và công suất (Watts)...")
    
    v = params["v_bike_ms"]
    m = params["m_total"]
    g = params["g"]
    theta = params["slope_rad"]
    Crr = params["Crr"]
    eta = params["eta_drivetrain"]
    
    # 1. Lực và Công suất chống lại trọng lực do dốc 5%
    F_gravity = m * g * math.sin(theta)
    P_gravity = F_gravity * v
    
    # 2. Lực và Công suất cản lăn
    F_rolling = Crr * m * g * math.cos(theta)
    P_rolling = F_rolling * v
    
    # 3. Lực và Công suất cản gió
    F_aero_val = F_aero
    P_aero = F_aero_val * v
    
    # 4. Tổng công suất thuần tại bánh xe
    P_wheel = P_gravity + P_rolling + P_aero
    
    # 5. Công suất thực tế người đạp cần tạo ra (bao gồm tổn hao xích líp 3%)
    P_rider = P_wheel / eta
    P_loss = P_rider - P_wheel
    
    # Tỷ số công suất / trọng lượng (W/kg)
    w_kg = P_rider / params["m_rider"]
    
    results = {
        "F_gravity": F_gravity,
        "P_gravity": P_gravity,
        "F_rolling": F_rolling,
        "P_rolling": P_rolling,
        "F_aero": F_aero_val,
        "P_aero": P_aero,
        "P_wheel": P_wheel,
        "P_loss": P_loss,
        "P_rider": P_rider,
        "W_per_kg": w_kg
    }
    
    return results

def plot_and_export_results(mesh, u_field, p_field, params, results, out_dir):
    """Vẽ biểu đồ phân tích và xuất dữ liệu trường dòng chảy"""
    print(f"[4/5] Xuất kết quả đồ thị và hình ảnh phân tích...")
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Đồ thị phân tích công suất
    fig = plt.figure(figsize=(15, 10), dpi=200)
    
    # Subplot 1: Cơ cấu công suất (Pie Chart)
    ax1 = fig.add_subplot(2, 2, 1)
    labels = [
        f'Thắng trọng lực (Dốc 5%)\n{results["P_gravity"]:.1f} W ({results["P_gravity"]/results["P_rider"]*100:.1f}%)',
        f'Khí động học (Cản gió)\n{results["P_aero"]:.1f} W ({results["P_aero"]/results["P_rider"]*100:.1f}%)',
        f'Ma sát lăn lốp\n{results["P_rolling"]:.1f} W ({results["P_rolling"]/results["P_rider"]*100:.1f}%)',
        f'Hao phí truyền động\n{results["P_loss"]:.1f} W ({results["P_loss"]/results["P_rider"]*100:.1f}%)'
    ]
    sizes = [results["P_gravity"], results["P_aero"], results["P_rolling"], results["P_loss"]]
    colors = ['#e74c3c', '#3498db', '#2ecc71', '#95a5a6']
    explode = (0.05, 0.05, 0.0, 0.0)
    ax1.pie(sizes, explode=explode, labels=labels, colors=colors, autopct='%1.1f%%',
            shadow=True, startangle=140, textprops={'fontsize': 10, 'weight': 'bold'})
    ax1.set_title("CƠ CẤU CÔNG SUẤT TIÊU TỐN (TỔNG: {:.1f} W)".format(results["P_rider"]),
                  fontsize=12, weight='bold', pad=15)
    
    # Subplot 2: Biểu đồ cột lực cản (Forces Breakdown)
    ax2 = fig.add_subplot(2, 2, 2)
    force_labels = ['Trọng lực (Dốc 5%)', 'Cản gió (Aero)', 'Cản lăn (Rolling)']
    forces = [results["F_gravity"], results["F_aero"], results["F_rolling"]]
    bars = ax2.bar(force_labels, forces, color=['#e74c3c', '#3498db', '#2ecc71'], width=0.5)
    ax2.set_ylabel("Lực cản (Newton - N)", fontsize=11, weight='bold')
    ax2.set_title("CÁC THÀNH PHẦN LỰC CẢN TRỞ CHUYỂN ĐỘNG", fontsize=12, weight='bold')
    ax2.grid(axis='y', linestyle='--', alpha=0.7)
    for bar in bars:
        yval = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2.0, yval + 0.8, f'{yval:.2f} N',
                 ha='center', va='bottom', fontsize=10, weight='bold')
                 
    # Subplot 3: Đường cong công suất theo vận tốc (Power vs Velocity)
    ax3 = fig.add_subplot(2, 2, 3)
    v_speeds_kmh = np.linspace(15, 50, 100)
    p_slopes = []
    p_flats = []
    
    m = params["m_total"]
    g = params["g"]
    theta = params["slope_rad"]
    Crr = params["Crr"]
    CdA = params["ref_CdA"]
    rho = params["rho_air"]
    eta = params["eta_drivetrain"]
    v_wind_ms = params["v_wind_ms"]
    
    for v_kmh in v_speeds_kmh:
        v_ms = v_kmh / 3.6
        v_app_ms = v_ms + v_wind_ms
        f_a = 0.5 * rho * CdA * (v_app_ms ** 2)
        f_r = Crr * m * g * math.cos(theta)
        f_g = m * g * math.sin(theta)
        
        p_total_slope = ((f_g + f_r + f_a) * v_ms) / eta
        p_total_flat  = ((0.0 + Crr * m * g + f_a) * v_ms) / eta
        p_slopes.append(p_total_slope)
        p_flats.append(p_total_flat)
        
    ax3.plot(v_speeds_kmh, p_slopes, 'r-', linewidth=2.5, label='Độ dốc 5% + Gió 3 km/h')
    ax3.plot(v_speeds_kmh, p_flats, 'b--', linewidth=2, label='Đường bằng phẳng (0%)')
    ax3.axvline(x=40.0, color='black', linestyle=':', label='Mốc 40 km/h')
    ax3.plot(40.0, results["P_rider"], 'ro', markersize=9, label=f'Điểm cần đạt: {results["P_rider"]:.1f} W')
    ax3.set_xlabel("Vận tốc xe đạp (km/h)", fontsize=11, weight='bold')
    ax3.set_ylabel("Công suất yêu cầu (Watts)", fontsize=11, weight='bold')
    ax3.set_title("QUAN HỆ CÔNG SUẤT VÀ VẬN TỐC", fontsize=12, weight='bold')
    ax3.grid(True, linestyle='--', alpha=0.6)
    ax3.legend(fontsize=9, loc='upper left')
    
    # Subplot 4: Bảng tóm tắt kết quả kỹ thuật
    ax4 = fig.add_subplot(2, 2, 4)
    ax4.axis('off')
    summary_text = (
        "╔════════════════════════════════════════════════════════════╗\n"
        "║             KẾT QUẢ MÔ PHỎNG VẬT LÝ CHI TIẾT               ║\n"
        "╠════════════════════════════════════════════════════════════╣\n"
        f"  • Vận tốc xe:                  {params['v_bike_kmh']:.1f} km/h ({params['v_bike_ms']:.2f} m/s)\n"
        f"  • Gió ngược:                   {params['v_wind_kmh']:.1f} km/h ({params['v_wind_ms']:.2f} m/s)\n"
        f"  • Vận tốc gió tương đối:       {params['v_rel_ms']*3.6:.1f} km/h ({params['v_rel_ms']:.2f} m/s)\n"
        f"  • Độ dốc mặt đường:            {params['slope_percent']:.1f}% (Góc: {math.degrees(params['slope_rad']):.2f}°)\n"
        f"  • Tổng khối lượng (Người+Xe):  {params['m_total']:.1f} kg (Xe Carbon: {params['m_bike']} kg)\n"
        f"  • Diện tích cản CdA (Aero):    {params['ref_CdA']:.3f} m²\n"
        "────────────────────────────────────────────────────────────\n"
        f"  ▶ LỰC CẢN TRỌNG LỰC:           {results['F_gravity']:.2f} N  ➔ {results['P_gravity']:.1f} W\n"
        f"  ▶ LỰC CẢN KHÍ ĐỘNG HỌC:        {results['F_aero']:.2f} N  ➔ {results['P_aero']:.1f} W\n"
        f"  ▶ LỰC CẢN LĂN CỦA LỐP:         {results['F_rolling']:.2f} N  ➔ {results['P_rolling']:.1f} W\n"
        f"  ▶ HAO PHÍ TRUYỀN ĐỘNG (3%):    {results['P_loss']:.1f} W\n"
        "────────────────────────────────────────────────────────────\n"
        f"  ★ TỔNG CÔNG SUẤT CẦN TẠO:      {results['P_rider']:.1f} WATT\n"
        f"  ★ CÔNG SUẤT TRÊN CÂN NẶNG:     {results['W_per_kg']:.2f} W/kg\n"
        "╚════════════════════════════════════════════════════════════╝\n"
        "\n* Nhận xét: Mức công suất ~760W tương đương cú nước rút\n"
        "  (sprint) tối đa của tay đua World Tour trong 30-60 giây."
    )
    ax4.text(0.05, 0.95, summary_text, transform=ax4.transAxes, fontsize=10,
             verticalalignment='top', fontfamily='monospace',
             bbox=dict(boxstyle='round,pad=0.8', facecolor='#f8f9fa', edgecolor='#bdc3c7', alpha=0.9))

    plt.tight_layout()
    plot_path = os.path.join(out_dir, "cycling_power_analysis.png")
    plt.savefig(plot_path, dpi=200)
    plt.close()
    print(f"      Đã lưu biểu đồ phân tích tại: {plot_path}")
    
    # 2. Vẽ hình ảnh mô phỏng trường vận tốc xung quanh người đạp
    fig2 = plt.figure(figsize=(12, 6), dpi=180)
    ax_flow = fig2.add_subplot(1, 1, 1)
    
    c = df.plot(u_field, title="Trường vận tốc dòng chảy quanh xe đạp và tay đua (FEniCS CFD)")
    plt.colorbar(c, ax=ax_flow, orientation='horizontal', pad=0.15, label="Vận tốc dòng khí |u| (m/s)")
    ax_flow.set_xlabel("X (mét) - Chiều dài hầm gió", fontsize=10)
    ax_flow.set_ylabel("Y (mét) - Chiều cao", fontsize=10)
    ax_flow.set_xlim(-1.0, 3.5)
    ax_flow.set_ylim(0.0, 2.2)
    flow_path = os.path.join(out_dir, "cyclist_velocity_field.png")
    plt.savefig(flow_path, dpi=180)
    plt.close()
    print(f"      Đã lưu hình ảnh trường vận tốc tại: {flow_path}")
    
    # 3. Xuất file ParaView VTK (.pvd)
    pvd_vel = df.File(os.path.join(out_dir, "velocity.pvd"))
    pvd_vel << u_field
    pvd_prs = df.File(os.path.join(out_dir, "pressure.pvd"))
    pvd_prs << p_field
    print(f"      Đã xuất file mô phỏng ParaView (.pvd) trong: {out_dir}/")

def main():
    print("=" * 70)
    print("   MÔ PHỎNG FEniCS: KHÍ ĐỘNG HỌC & CÔNG SUẤT XE ĐẠP ĐUA CARBON")
    print("   Vận tốc: 40 km/h | Gió ngược: 3 km/h | Độ dốc: 5%")
    print("=" * 70)
    
    params = setup_parameters()
    mesh, bounds = create_geometry_and_mesh()
    u_field, p_field, F_aero, CdA = solve_aerodynamics(mesh, bounds, params)
    results = calculate_power_breakdown(params, F_aero)
    
    out_dir = os.path.expanduser("~/Hackathon-Rmit-2026/cycling_aero_simulation/output")
    plot_and_export_results(mesh, u_field, p_field, params, results, out_dir)
    
    print("=" * 70)
    print(f"★ KẾT QUẢ CUỐI CÙNG:")
    print(f"  • Công suất người đạp cần tạo ra: {results['P_rider']:.2f} WATT")
    print(f"  • Tỷ lệ công suất trên cân nặng:   {results['W_per_kg']:.2f} W/kg")
    print("=" * 70)

if __name__ == "__main__":
    main()
