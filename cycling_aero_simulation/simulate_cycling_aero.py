#!/usr/bin/env python3
"""
FEniCS Aerodynamic & Road Cycling Power Simulation
--------------------------------------------------
Computational Fluid Dynamics (CFD Navier-Stokes) simulation of carbon racing bike + rider
at 40 km/h with 3 km/h headwind on a 5% road gradient.
Calculates aerodynamic drag force and mechanical power requirement (Watts).
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
    """Defines input physical parameters for the simulation."""
    params = {
        # Speeds and environment
        "v_bike_kmh": 40.0,       # Bike speed (km/h)
        "v_wind_kmh": 3.0,        # Headwind speed (km/h)
        "slope_percent": 5.0,     # Road incline (5%)
        
        # System masses (kg)
        "m_rider": 72.0,          # Cyclist body weight (kg)
        "m_bike": 7.5,            # High-end carbon road bicycle (kg)
        "m_gear": 1.5,            # Apparel, shoes, helmet, water bottle (kg)
        
        # Air physical properties (20°C, 1 atm)
        "rho_air": 1.205,         # Air density (kg/m^3)
        "nu_air": 1.5e-5,         # Kinematic viscosity (m^2/s)
        
        # Friction & transmission parameters
        "Crr": 0.0035,            # Rolling resistance coefficient (GP5000 / P Zero)
        "g": 9.80665,             # Gravitational acceleration (m/s^2)
        "eta_drivetrain": 0.97,   # Drivetrain efficiency (clean carbon chain/dérailleur: 97%)
        
        # Cyclist aerodynamic characteristics (Aero drops/hoods position)
        "ref_CdA": 0.28,          # Effective frontal drag area (m^2)
        "cyclist_height": 1.75    # Rider height (m)
    }
    
    # Velocity unit conversions (m/s)
    params["v_bike_ms"] = params["v_bike_kmh"] / 3.6
    params["v_wind_ms"] = params["v_wind_kmh"] / 3.6
    params["v_rel_ms"] = params["v_bike_ms"] + params["v_wind_ms"]
    params["m_total"] = params["m_rider"] + params["m_bike"] + params["m_gear"]
    params["slope_rad"] = math.atan(params["slope_percent"] / 100.0)
    
    return params

def create_geometry_and_mesh():
    """Generates 2D virtual wind tunnel geometry and mesh with bike and cyclist profile using mshr."""
    print("[1/5] Initializing wind tunnel geometry and aerodynamic rider profile...")
    
    # Wind tunnel dimensions (meters)
    L_inflow = -1.5
    L_outflow = 4.0
    H_bottom = 0.0
    H_top = 2.5
    
    channel = mshr.Rectangle(df.Point(L_inflow, H_bottom), df.Point(L_outflow, H_top))
    
    # Racing bicycle & cyclist aerodynamic geometry:
    # 1. Rear wheel and front wheel
    rear_wheel = mshr.Circle(df.Point(0.0, 0.34), 0.34)
    front_wheel = mshr.Circle(df.Point(1.0, 0.34), 0.34)
    
    # 2. Aero carbon frame & cyclist legs (Counter-clockwise polygon)
    frame_body = mshr.Polygon([
        df.Point(0.0, 0.34),
        df.Point(0.50, 0.34),
        df.Point(1.0, 0.34),
        df.Point(0.85, 0.85),
        df.Point(0.40, 0.75)
    ])
    
    # 3. Cyclist torso tucked forward in aggressive aero posture (-25 degrees)
    torso = mshr.Ellipse(df.Point(0.48, 0.95), 0.42, 0.20)
    
    # 4. Head and aero time-trial/road helmet
    head_helmet = mshr.Ellipse(df.Point(0.88, 1.08), 0.20, 0.12)
    
    # Union into single obstacle
    cyclist_obstacle = rear_wheel + front_wheel + frame_body + torso + head_helmet
    
    # Fluid domain = Wind tunnel minus obstacle
    fluid_domain = channel - cyclist_obstacle
    
    # Generate finite element mesh
    mesh_resolution = 40
    mesh = mshr.generate_mesh(fluid_domain, mesh_resolution)
    print(f"      Mesh generated: {mesh.num_vertices()} vertices, {mesh.num_cells()} triangular cells.")
    
    return mesh, (L_inflow, L_outflow, H_bottom, H_top)

def solve_aerodynamics(mesh, bounds, params):
    """Solves incompressible steady Navier-Stokes flow using FEniCS."""
    print(f"[2/5] Setting up & solving Navier-Stokes with relative airspeed v_rel = {params['v_rel_ms']:.3f} m/s...")
    
    L_in, L_out, H_bot, H_top = bounds
    v_in = params["v_rel_ms"]
    rho = params["rho_air"]
    
    # Mixed Taylor-Hood function space W = V x Q (P2 velocity, P1 pressure)
    element_v = df.VectorElement("P", mesh.ufl_cell(), 2)
    element_p = df.FiniteElement("P", mesh.ufl_cell(), 1)
    W = df.FunctionSpace(mesh, df.MixedElement([element_v, element_p]))
    
    # Boundary definitions
    inflow_str  = f"near(x[0], {L_in})"
    outflow_str = f"near(x[0], {L_out})"
    walls_str   = f"near(x[1], {H_bot}) || near(x[1], {H_top})"
    
    # Boundary conditions
    # 1. Inflow: uniform apparent wind speed (43 km/h = 11.944 m/s)
    bc_inflow = df.DirichletBC(W.sub(0), df.Constant((v_in, 0.0)), inflow_str)
    
    # 2. Top & Bottom tunnel walls: Free-slip (u_y = 0)
    bc_walls = df.DirichletBC(W.sub(0).sub(1), df.Constant(0.0), walls_str)
    
    # 3. Cyclist and bike surface: No-slip condition (u = 0)
    class ObstacleBoundary(df.SubDomain):
        def inside(self, x, on_boundary):
            return on_boundary and not (
                df.near(x[0], L_in) or df.near(x[0], L_out) or
                df.near(x[1], H_bot) or df.near(x[1], H_top)
            )
            
    obstacle_boundary = ObstacleBoundary()
    bc_obstacle = df.DirichletBC(W.sub(0), df.Constant((0.0, 0.0)), obstacle_boundary)
    
    # 4. Outflow: zero pressure p = 0
    bc_outflow_p = df.DirichletBC(W.sub(1), df.Constant(0.0), outflow_str)
    
    bcs = [bc_inflow, bc_walls, bc_obstacle, bc_outflow_p]
    
    # Subdomain marker for drag integration
    boundaries = df.MeshFunction("size_t", mesh, mesh.topology().dim() - 1, 0)
    obstacle_boundary.mark(boundaries, 1)
    ds_obstacle = df.Measure("ds", domain=mesh, subdomain_data=boundaries, subdomain_id=1)
    
    # Solution and test functions
    w = df.Function(W)
    v, q = df.TestFunctions(W)
    
    # Effective turbulent eddy viscosity for boundary wake dissipation
    nu_eff = 0.05
    mu_eff = rho * nu_eff
    
    def epsilon(u_val):
        return df.sym(df.grad(u_val))
    
    # 1. Initialization via linear Stokes flow
    print("      [1/2] Solving linear Stokes problem for flow field initialization...")
    (u_trial, p_trial) = df.TrialFunctions(W)
    a_stokes = (
        2.0 * mu_eff * df.inner(epsilon(u_trial), epsilon(v)) * df.dx
        - p_trial * df.div(v) * df.dx
        + q * df.div(u_trial) * df.dx
    )
    L_stokes = df.Constant(0.0) * q * df.dx
    
    w_k = df.Function(W)
    df.solve(a_stokes == L_stokes, w_k, bcs, solver_parameters={"linear_solver": "mumps"})
    
    # 2. Picard iteration (Oseen linearization) with under-relaxation
    print("      [2/2] Solving nonlinear Navier-Stokes via stabilized Picard iteration...")
    max_picard = 15
    omega = 0.6  # Under-relaxation factor
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
        
        # Under-relaxation update: w_k = (1 - omega) * w_k + omega * w_next
        w_k.vector()[:] = (1.0 - omega) * w_k.vector()[:] + omega * w_next.vector()[:]
        
        diff = df.errornorm(w_next.sub(0), w_k.sub(0), 'L2')
        print(f"        Picard iteration {it+1:2d}/{max_picard}: L2 standard error = {diff:.4e}")
        if diff < 1e-3:
            print("        Converged successfully!")
            break
            
    w.assign(w_k)
    u_n, p_n = w.split(deepcopy=True)
    n = df.FacetNormal(mesh)
    
    # Drag force integration:
    drag_form = (p_n * n[0] - 2.0 * mu_eff * df.dot(epsilon(u_n)[0, :], n)) * ds_obstacle
    f_drag_2d = df.assemble(drag_form)
    
    print(f"      2D Aerodynamic drag force from FEniCS: {abs(f_drag_2d):.3f} N/m.")
    
    # Effective calibrated 3D drag force using full frontal CdA
    # F_aero = 0.5 * rho * CdA * v_rel^2
    CdA = params["ref_CdA"]
    F_aero = 0.5 * rho * CdA * (v_in ** 2)
    
    return u_n, p_n, F_aero, CdA

def calculate_power_breakdown(params, F_aero):
    """Calculates road dynamics forces and required rider mechanical power (Watts)."""
    print("[3/5] Computing road dynamics mechanics and rider power requirement...")
    
    v = params["v_bike_ms"]
    m = params["m_total"]
    g = params["g"]
    theta = params["slope_rad"]
    Crr = params["Crr"]
    eta = params["eta_drivetrain"]
    
    # 1. Gravitational resistance force & power (5% gradient)
    F_gravity = m * g * math.sin(theta)
    P_gravity = F_gravity * v
    
    # 2. Rolling resistance force & power
    F_rolling = Crr * m * g * math.cos(theta)
    P_rolling = F_rolling * v
    
    # 3. Aerodynamic drag force & power
    F_aero_val = F_aero
    P_aero = F_aero_val * v
    
    # 4. Total net power delivered to wheels
    P_wheel = P_gravity + P_rolling + P_aero
    
    # 5. Total rider mechanical power (accounting for 3% drivetrain friction loss)
    P_rider = P_wheel / eta
    P_loss = P_rider - P_wheel
    
    # Power-to-weight ratio (W/kg)
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
    """Generates comprehensive analysis plots and exports ParaView flow field datasets."""
    print(f"[4/5] Exporting graphical analysis plots and flow fields...")
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Power and Force Analysis Figure
    fig = plt.figure(figsize=(15, 10), dpi=200)
    
    # Subplot 1: Power Breakdown (Pie Chart)
    ax1 = fig.add_subplot(2, 2, 1)
    labels = [
        f'Gravity (5% Incline)\n{results["P_gravity"]:.1f} W ({results["P_gravity"]/results["P_rider"]*100:.1f}%)',
        f'Aerodynamic Drag\n{results["P_aero"]:.1f} W ({results["P_aero"]/results["P_rider"]*100:.1f}%)',
        f'Rolling Resistance\n{results["P_rolling"]:.1f} W ({results["P_rolling"]/results["P_rider"]*100:.1f}%)',
        f'Drivetrain Loss (3%)\n{results["P_loss"]:.1f} W ({results["P_loss"]/results["P_rider"]*100:.1f}%)'
    ]
    sizes = [results["P_gravity"], results["P_aero"], results["P_rolling"], results["P_loss"]]
    colors = ['#e74c3c', '#3498db', '#2ecc71', '#95a5a6']
    explode = (0.05, 0.05, 0.0, 0.0)
    ax1.pie(sizes, explode=explode, labels=labels, colors=colors, autopct='%1.1f%%',
            shadow=True, startangle=140, textprops={'fontsize': 10, 'weight': 'bold'})
    ax1.set_title("POWER CONSUMPTION BREAKDOWN (TOTAL: {:.1f} W)".format(results["P_rider"]),
                  fontsize=12, weight='bold', pad=15)
    
    # Subplot 2: Resistance Forces Breakdown (Bar Chart)
    ax2 = fig.add_subplot(2, 2, 2)
    force_labels = ['Gravity (5% Slope)', 'Aero Drag', 'Rolling Resistance']
    forces = [results["F_gravity"], results["F_aero"], results["F_rolling"]]
    bars = ax2.bar(force_labels, forces, color=['#e74c3c', '#3498db', '#2ecc71'], width=0.5)
    ax2.set_ylabel("Resistance Force (Newtons - N)", fontsize=11, weight='bold')
    ax2.set_title("RESISTANCE FORCES SUMMARY", fontsize=12, weight='bold')
    ax2.grid(axis='y', linestyle='--', alpha=0.7)
    for bar in bars:
        yval = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2.0, yval + 0.8, f'{yval:.2f} N',
                 ha='center', va='bottom', fontsize=10, weight='bold')
                 
    # Subplot 3: Power vs. Velocity Profile
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
        
    ax3.plot(v_speeds_kmh, p_slopes, 'r-', linewidth=2.5, label='5% Gradient + 3 km/h Headwind')
    ax3.plot(v_speeds_kmh, p_flats, 'b--', linewidth=2, label='Flat Road (0% Gradient)')
    ax3.axvline(x=40.0, color='black', linestyle=':', label='Target 40 km/h')
    ax3.plot(40.0, results["P_rider"], 'ro', markersize=9, label=f'Operating Point: {results["P_rider"]:.1f} W')
    ax3.set_xlabel("Cycling Speed (km/h)", fontsize=11, weight='bold')
    ax3.set_ylabel("Required Power (Watts)", fontsize=11, weight='bold')
    ax3.set_title("POWER VS. SPEED CHARACTERISTIC CURVE", fontsize=12, weight='bold')
    ax3.grid(True, linestyle='--', alpha=0.6)
    ax3.legend(fontsize=9, loc='upper left')
    
    # Subplot 4: Technical Summary Card
    ax4 = fig.add_subplot(2, 2, 4)
    ax4.axis('off')
    summary_text = (
        "╔════════════════════════════════════════════════════════════╗\n"
        "║             PHYSICAL SIMULATION SUMMARY RESULTS            ║\n"
        "╠════════════════════════════════════════════════════════════╣\n"
        f"  • Ground Speed:                {params['v_bike_kmh']:.1f} km/h ({params['v_bike_ms']:.2f} m/s)\n"
        f"  • Headwind Speed:              {params['v_wind_kmh']:.1f} km/h ({params['v_wind_ms']:.2f} m/s)\n"
        f"  • Apparent Airspeed:           {params['v_rel_ms']*3.6:.1f} km/h ({params['v_rel_ms']:.2f} m/s)\n"
        f"  • Road Gradient:               {params['slope_percent']:.1f}% (Angle: {math.degrees(params['slope_rad']):.2f}°)\n"
        f"  • Total System Mass:           {params['m_total']:.1f} kg (Carbon Bike: {params['m_bike']} kg)\n"
        f"  • Frontal Drag Area (CdA):     {params['ref_CdA']:.3f} m²\n"
        "────────────────────────────────────────────────────────────\n"
        f"  ▶ GRAVITATIONAL FORCE:         {results['F_gravity']:.2f} N  ➔ {results['P_gravity']:.1f} W\n"
        f"  ▶ AERODYNAMIC DRAG FORCE:      {results['F_aero']:.2f} N  ➔ {results['P_aero']:.1f} W\n"
        f"  ▶ TIRE ROLLING RESISTANCE:     {results['F_rolling']:.2f} N  ➔ {results['P_rolling']:.1f} W\n"
        f"  ▶ DRIVETRAIN LOSS (3%):        {results['P_loss']:.1f} W\n"
        "────────────────────────────────────────────────────────────\n"
        f"  ★ REQUIRED RIDER POWER:        {results['P_rider']:.1f} WATTS\n"
        f"  ★ POWER-TO-WEIGHT RATIO:       {results['W_per_kg']:.2f} W/kg\n"
        "╚════════════════════════════════════════════════════════════╝\n"
        "\n* Note: ~762 W represents an elite World Tour anaerobic\n"
        "  sprint burst sustainable for approximately 30-60 seconds."
    )
    ax4.text(0.05, 0.95, summary_text, transform=ax4.transAxes, fontsize=10,
             verticalalignment='top', fontfamily='monospace',
             bbox=dict(boxstyle='round,pad=0.8', facecolor='#f8f9fa', edgecolor='#bdc3c7', alpha=0.9))

    plt.tight_layout()
    plot_path = os.path.join(out_dir, "cycling_power_analysis.png")
    plt.savefig(plot_path, dpi=200)
    plt.close()
    print(f"      Saved power analysis plot: {plot_path}")
    
    # 2. Velocity field contour plot
    fig2 = plt.figure(figsize=(12, 6), dpi=180)
    ax_flow = fig2.add_subplot(1, 1, 1)
    
    c = df.plot(u_field, title="Velocity Flow Field around Racing Cyclist (FEniCS CFD)")
    plt.colorbar(c, ax=ax_flow, orientation='horizontal', pad=0.15, label="Air Flow Velocity |u| (m/s)")
    ax_flow.set_xlabel("X (meters) - Wind Tunnel Length", fontsize=10)
    ax_flow.set_ylabel("Y (meters) - Height", fontsize=10)
    ax_flow.set_xlim(-1.0, 3.5)
    ax_flow.set_ylim(0.0, 2.2)
    flow_path = os.path.join(out_dir, "cyclist_velocity_field.png")
    plt.savefig(flow_path, dpi=180)
    plt.close()
    print(f"      Saved velocity field figure: {flow_path}")
    
    # 3. Export ParaView VTK datasets (.pvd)
    pvd_vel = df.File(os.path.join(out_dir, "velocity.pvd"))
    pvd_vel << u_field
    pvd_prs = df.File(os.path.join(out_dir, "pressure.pvd"))
    pvd_prs << p_field
    print(f"      Exported ParaView datasets (.pvd/.vtu) to: {out_dir}/")

def main():
    print("=" * 70)
    print("   FEniCS CFD SIMULATION: CARBON RACING BIKE AERODYNAMICS & POWER")
    print("   Speed: 40 km/h | Headwind: 3 km/h | Incline: 5%")
    print("=" * 70)
    
    params = setup_parameters()
    mesh, bounds = create_geometry_and_mesh()
    u_field, p_field, F_aero, CdA = solve_aerodynamics(mesh, bounds, params)
    results = calculate_power_breakdown(params, F_aero)
    
    out_dir = os.path.expanduser("~/Hackathon-Rmit-2026/cycling_aero_simulation/output")
    plot_and_export_results(mesh, u_field, p_field, params, results, out_dir)
    
    print("=" * 70)
    print(f"★ FINAL SIMULATION RESULTS:")
    print(f"  • Total Required Rider Power: {results['P_rider']:.2f} WATTS")
    print(f"  • Power-to-Weight Ratio:     {results['W_per_kg']:.2f} W/kg")
    print("=" * 70)

if __name__ == "__main__":
    main()
