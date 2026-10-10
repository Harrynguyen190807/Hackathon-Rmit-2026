# Carbon Racing Bike Aerodynamics (CFD) & Power Simulation using FEniCS

Numerical simulation solving the incompressible **Navier-Stokes equations** (Computational Fluid Dynamics - CFD) using **FEniCS** coupled with professional road cycling dynamics mechanics.

---

## 🎯 Problem Statement & Conditions

* **Bike Ground Speed ($v$):** $40 \text{ km/h} = 11.111 \text{ m/s}$.
* **Headwind Velocity ($v_w$):** $3 \text{ km/h} = 0.833 \text{ m/s}$.
* **Apparent Airspeed ($v_{\text{rel}}$):** $43 \text{ km/h} = 11.944 \text{ m/s}$.
* **Road Gradient ($s$):** $5\%$ ($\theta \approx 2.862^\circ$).
* **Total System Mass ($m_{\text{total}}$):** $81.0 \text{ kg}$ (Rider $72 \text{ kg}$ + Elite Carbon Road Bike $7.5 \text{ kg}$ + Gear/Helmet/Shoes/Water $1.5 \text{ kg}$).
* **Rolling Resistance Coefficient ($C_{rr}$):** $0.0035$ (Continental Grand Prix 5000 / Pirelli P Zero Race on smooth asphalt).
* **Air Physical Properties:** Density $\rho = 1.205 \text{ kg/m}^3$, kinematic viscosity $\nu = 1.5 \times 10^{-5} \text{ m}^2/\text{s}$.
* **Drivetrain Mechanical Efficiency ($\eta$):** $97\%$ (3% mechanical transmission friction loss).

---

## 📐 Mathematical Model & Finite Element Method (FEniCS)

### 1. Incompressible Steady Navier-Stokes Flow
Solves the stationary incompressible Navier-Stokes system:
$$\rho (\mathbf{u} \cdot \nabla)\mathbf{u} = -\nabla p + \mu_{\text{eff}} \nabla^2 \mathbf{u}$$
$$\nabla \cdot \mathbf{u} = 0$$

* **Taylor-Hood Mixed Function Space:** $P_2 - P_1$ (Quadratic velocity elements, linear pressure elements).
* **Numerical Solver:** Initialized via linear Stokes flow, followed by stabilized Oseen/Picard nonlinear iterations with under-relaxation ($\omega = 0.6$) coupled with the **MUMPS** parallel direct linear solver.
* **Boundary Conditions:**
  * Inflow ($x = -1.5\text{ m}$): $\mathbf{u} = (11.944, 0) \text{ m/s}$.
  * Outflow ($x = 4.0\text{ m}$): $p = 0$.
  * Tunnel Walls: Free-slip $u_y = 0$.
  * Bike & Rider Obstacle Surface ($\Gamma_{\text{bike}}$): No-slip $\mathbf{u} = \mathbf{0}$.

### 2. Road Cycling Power Mechanics
$$P_{\text{rider}} = \frac{P_{\text{gravity}} + P_{\text{aero}} + P_{\text{rolling}}}{\eta_{\text{drivetrain}}}$$

Where:
* $P_{\text{gravity}} = m \cdot g \cdot \sin(\theta) \cdot v$
* $P_{\text{aero}} = F_{\text{drag}} \cdot v = \frac{1}{2} \rho (C_d A) v_{\text{rel}}^2 \cdot v$
* $P_{\text{rolling}} = C_{rr} \cdot m \cdot g \cdot \cos(\theta) \cdot v$

---

## 📊 Detailed Simulation Results

| Resistance Component | Resistance Force (N) | Power Consumed (W) | Share (%) |
| :--- | :---: | :---: | :---: |
| **1. Gravitational Resistance (5% Incline)** | **39.67 N** | **440.8 W** | **57.9%** |
| **2. Aerodynamic Air Drag (CFD)** | **24.08 N** | **267.6 W** | **35.1%** |
| **3. Tire Rolling Resistance** | **2.78 N** | **30.9 W** | **4.1%** |
| **4. Drivetrain Mechanical Loss (3%)** | - | **22.6 W** | **3.0%** |
| **★ TOTAL REQUIRED RIDER POWER** | **66.53 N** | **761.88 WATTS** | **100.0%** |

* **Power-to-Weight Ratio:** **10.58 W/kg**.

> 💡 **Physiological Analysis:** 
> Maintaining **40 km/h** up a **5% gradient** against a headwind requires **~762 Watts**. This represents an extreme **Anaerobic Sprint** exertion for elite World Tour riders (such as Tadej Pogačar or Mathieu van der Poel) sustainable for only **30 – 60 seconds**.
> In realistic competitive racing, sustaining an elite FTP climb output of 350 – 400 W on a 5% slope yields a cruising speed of **25 – 28 km/h**.

---

## 🚀 Reproduction & Visualization

To execute the simulation:
```bash
cd ~/Hackathon-Rmit-2026/cycling_aero_simulation
python3 simulate_cycling_aero.py
```

Generated plots and 3D datasets are saved in `output/`:
* `output/cycling_power_analysis.png`: High-resolution power breakdown, force distribution, and $P - v$ characteristic curve.
* `output/cyclist_velocity_field.png`: Airflow velocity magnitude field around the cyclist and frame.
* `output/velocity.pvd` & `output/pressure.pvd`: ParaView VTK datasets for 3D vector and streamline visualization.
