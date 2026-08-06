// REPAIRHUB ADMIN DASHBOARD

import Chart from "chart.js/auto";
import { requireAdmin, renderAdminLayout } from "./components/admin-layout.js";

requireAdmin();

renderAdminLayout({
    active: "dashboard",
    pageTitle: "Admin Command Center",
    pageSubtitle: "Real-time overview of Nigeria's #1 repair marketplace.",
});


// REVENUE CHART


// Monthly labels
const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];


// Revenue data
const revenueData = [
    12,
    15,
    18,
    14,
    22,
    28,
    30,
    27,
    35,
    42,
    38,
    48
];


// Commission data
const commissionData = [
    2,
    2.5,
    3,
    2.5,
    3.5,
    4,
    4.5,
    4,
    5,
    6,
    5.5,
    7
];


// Get chart canvas
const chartCanvas = document.getElementById("revenueChart");


// Create chart
const revenueChart = new Chart(chartCanvas, {

    type: "line",

    data: {

        labels: months,

        datasets: [

            {
                label: "Revenue",

                data: revenueData,

                borderColor: "#2563eb",

                backgroundColor: "rgba(37, 99, 235, 0.08)",

                borderWidth: 3,

                fill: true,

                tension: 0.4,

                pointRadius: 4,

                pointBackgroundColor: "#2563eb"

            },

            {
                label: "Commission",

                data: commissionData,

                borderColor: "#10b981",

                backgroundColor: "rgba(16, 185, 129, 0.05)",

                borderWidth: 2,

                fill: true,

                tension: 0.4,

                pointRadius: 3,

                pointBackgroundColor: "#10b981"

            }

        ]

    },


    options: {

        responsive: true,

        maintainAspectRatio: false,


        interaction: {

            intersect: false,

            mode: "index"

        },


        plugins: {

            legend: {

                display: false

            },


            tooltip: {

                backgroundColor: "#0f172a",

                padding: 12,

                titleFont: {

                    size: 13

                },

                bodyFont: {

                    size: 12

                }

            }

        },


        scales: {

            y: {

                beginAtZero: true,

                max: 50,

                ticks: {

                    stepSize: 5,

                    color: "#64748b",

                    font: {

                        size: 10

                    }

                },

                grid: {

                    color: "#e2e8f0"

                }

            },


            x: {

                ticks: {

                    color: "#64748b",

                    font: {

                        size: 10

                    }

                },

                grid: {

                    display: false

                }

            }

        }

    }

});


//BACKEND FUNCTION


// when we start backend, backend API can replace


async function loadDashboardData() {

    try {

        // Example for backend:

        // const response = await fetch(
        //     "http://localhost:5000/api/admin/dashboard"
        // );

        // const data = await response.json();


        // Example:
        // revenueChart.data.datasets[0].data = data.revenue;
        // revenueChart.data.datasets[1].data = data.commission;

        // revenueChart.update();


        console.log("Dashboard ready for backend data.");

    } catch (error) {

        console.error(
            "Unable to load dashboard data:",
            error
        );

    }

}


// Run dashboard data function
loadDashboardData();