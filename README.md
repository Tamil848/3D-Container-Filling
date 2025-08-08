# 📦 3D Container Filling Application

The **3D Container Filling App** is an intelligent visualization tool that helps optimize space usage by arranging packages inside a container. Simply input the container dimensions and package sizes, and the app will generate a 3D visual of how the items fit inside.

---

## 🚀 Features

- 🎯 **3D Visualization** of package placement inside a container
- 📐 Supports custom **container and package dimensions**
- 🔄 Option to allow or disallow **package rotation**
- 🧠 Uses **space optimization algorithms** to minimize empty space
- 📊 Summary of filled space, unused space, and package count
- 💾 Export 3D layout as **image** or **PDF**

---

## 📥 Input Format

### ✅ Container Dimensions

| Field      | Description         |
|------------|---------------------|
| Length     | Container length (in cm/inches) |
| Width      | Container width     |
| Height     | Container height    |

### ✅ Package List (Excel or JSON)

| PackageID | Length | Width | Height | Quantity |
|-----------|--------|-------|--------|----------|
| P1        | 30     | 20    | 10     | 10       |
| P2        | 50     | 40    | 30     | 5        |
| P3        | 10     | 10    | 10     | 50       |

You can upload these values via:
- 📂 Excel (`.xlsx`)
- 📄 JSON (`.json`)
- ⌨️ Manual form entry

---

## 🧠 Packing Logic

- **3D Bin Packing Algorithm**
- Tries to fit the maximum number of packages
- Can stack, rotate, or align based on user settings
- Avoids overlap or overflow

---

## 🎮 UI Interactions

- 🔄 Rotate the 3D container view
- 🔍 Zoom and Pan for detailed inspection
- 🧊 Click on packages to see dimensions and ID
- 🎨 Color-coded by package type

---

## 📦 Output Summary

| Metric            | Description                         |
|-------------------|-------------------------------------|
| Total Packages    | Number of packages successfully placed |
| Space Utilization | % of container volume used          |
| Free Volume       | Remaining space inside the container |
| Export Options    | Save layout as image/PDF            |

---

## 🛠️ Installation / Usage

### 🔧 Run Locally

```bash
git clone https://github.com/yourusername/3d-container-filling-app.git
cd 3d-container-filling-app

# If using Node.js + Three.js
npm install
npm start

# OR if using .NET with Unity/WPF
dotnet restore
dotnet run

