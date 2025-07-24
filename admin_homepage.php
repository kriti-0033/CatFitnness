<?php
session_start();
?>

<!DOCTYPE html>
<html lang="en">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MewFit Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Mogra&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
<link rel="icon" type="./assets/image/x-icon" href="./assets/icons/cat-logo-tabs.png">
<link rel="stylesheet" href="./css/navigation_bar.css">
<link rel="stylesheet" href="./css/admin_homepage.css">
<script src="js/navigation_bar.js"></script>
<script src="js/admin_homepage.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
    h3 {
        font-size: 20px !important;
        color: #795858 !important;
        margin-bottom: 20px;
        text-align: left !important;
    }

    .chart-description {
        z-index: 2;
        visibility: hidden;
        opacity: 0;
        transform: translateY(-20px);
        transition: opacity 0.3s ease, transform 0.3s ease, visibility 0s 0.3s;
        padding: 10px;
        background-color: rgb(255, 251, 247);
        border-left: 4px solid rgb(255, 153, 50);
        margin-top: 10px;
        font-size: 14px;
        border-radius: 5px;
        color: rgb(190, 138, 85);
        line-height: 20px;
    }

    .fade-in-up {
        visibility: visible;
        opacity: 1;
        transform: translateY(0);
        transition: opacity 0.3s ease, transform 0.3s ease, visibility 0s;
    }

    .fade-out-down {
        opacity: 0;
        transform: translateY(-20px);
        visibility: hidden;
        transition: opacity 0.3s ease, transform 0.3s ease, visibility 0s 0.3s;
    }

    .greetings-word {
        padding: 25px 0px 25px 0px;
        line-height: 33px;
        width: 70%;
        font-size: 18px;
    }

    .greetings {
        display: flex;
    }

    .detail-summary {
        font-weight: bold;
        padding-bottom: 10px;
    }

    @media screen and (max-width: 832px) {
        .greetings {
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .greetings-word {
            display: none;
        }

        .detail-summary {
            display: none;
        }
    }
</style>
</head>
<?php include "conn.php" ?>

<body>
    <nav class="navbar" id="navbar">
        <div class="nav-links" id="nav-links">
            <img src="./assets/icons/mewfit-admin-logo.svg" alt="logo" class="nav-logo" id="nav-logo">
            <span class="admin-dashboard"><a href="#" class="active">DASHBOARD</a></span>
            <span class="admin-user"><a href="admin_user_page.php">USER</a></span>
            <span class="admin-workout"><a href="admin_workout.php">WORKOUT</a></span>
            <span class="admin-meals"><a href="admin_diet.php">MEALS</a></span>
        </div>
        <div class="header-right">
            <button id="hamburger-menu" aria-label="Menu">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
        <image src="./assets/icons/admin_logout.svg" class="logout-profile" id="logout-profile"></image>
    </nav>


    <div class="content">
        <!-- greetings -->
        <div style="padding-bottom: 20px;border-bottom: 1px solid rgb(186, 186, 186);">
            <div class="greetings">
                <div>
                    <div style="display:flex;">
                        <?php
                        echo "
                        <h1 id=\"type\">Hello, <span style=\"color:#FF9F39\">{$_SESSION['admin username']}</span></h1>
                        <h1 class=\"cursor\">|</h1>
                        ";
                        ?>
                    </div>
                    <p class="greetings-word">This platform provides comprehensive reports on user data, including diet and workout trends,
                        for in-depth analysis. Explore the charts and containers by hovering or clicking to access detailed insights. Gain
                        valuable information to better understand and optimize fitness strategies tailored to individual needs!</p>
                </div>
                <img src="./assets/icons/level.svg" class="cat" alt="Logo">
            </div>
        </div>


        <!-- summary -->
        <h2>Summary for this month</h2>
        <section class="summary-container">
            <?php
            function getCount($dbConn, $table)
            {
                $sql = "SELECT COUNT(*) AS total FROM $table";
                return $dbConn->query($sql)->fetch_assoc()['total'] ?? 0;
            }
            function comparison($dbConn, $table)
            {
                $currentYear = date('Y');
                $currentMonth = date('m');

                $sql = "SELECT COUNT(*) AS currentmonth FROM $table WHERE MONTH(date_registered) = $currentMonth AND YEAR(date_registered) = $currentYear";
                $currentResult = $dbConn->query($sql)->fetch_assoc()['currentmonth'] ?? 0;

                $sql = "SELECT COUNT(*) AS total FROM $table";
                $beforeResult = $dbConn->query($sql)->fetch_assoc()['total'] ?? 0;

                if ($currentResult == 0) {
                    return 0;
                }

                $comparison = round($currentResult / $beforeResult * 100, 2);
                return $comparison;
            }

            $memberNo = getCount($dbConn, 'member');
            $adminNo = getCount($dbConn, 'administrator');

            $memberCompare = comparison($dbConn, 'member');
            $adminCompare = comparison($dbConn, 'administrator');
            ?>

            <div class="summary" style="background-color:#DBFAFF;">
                <div>
                    <h5>User</h5>
                    <h6 class="count-up"><?php echo $adminNo + $memberNo; ?></h6>
                    <p class="detail-summary">Member: <?php echo $memberNo; ?> Admin: <?php echo $adminNo ?></p>
                    <p>Increase by <span class="count-up-p"><?php echo $memberCompare + $adminCompare; ?></span></p>
                </div>
                <img src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png">
            </div>
            <div class="summary" style="background-color:#FFF1DB; animation-delay: 0.5s;">
                <div>
                    <h5>Workout</h5>
                    <h6 class="count-up"><?php echo getCount($dbConn, 'workout'); ?></h6>
                    <p>Increase by <span class="count-up-p"><?php echo comparison($dbConn, 'workout'); ?></span></p>
                </div>
                <img src="https://png.pngtree.com/png-vector/20230407/ourmid/pngtree-workout-line-icon-vector-png-image_6680960.png" style="width:100px;height:100px; ">
            </div>
            <div class="summary" style="background-color:#FFDBDB; animation-delay: 0.8s;">
                <div>
                    <h5>Diet</h5>
                    <h6 class="count-up"><?php echo getCount($dbConn, 'diet'); ?></h6>
                    <p class="detail-summary">Ingredients: <?php echo getCount($dbConn, 'nutrition'); ?></p>
                    <p>Increase by <span class="count-up-p"><?php echo comparison($dbConn, 'diet'); ?></span></p>
                </div>
                <img src="https://cdn-icons-png.flaticon.com/512/706/706133.png">
            </div>
        </section>

        <!-- member analysis -->
        <section>
            <h2>Member Analysis</h2>
            <div>
                <div class="containers">
                    <h3>Member Personal Information</h3>
                    <div class="chart">
                        <div>
                            <h4>Gender & Fitness Goal Growth</h4>
                            <canvas id="CumulativeGenderChart" class="chart" data-description="Description1"></canvas>
                            <section id="Description1" class="chart-description">
                                <p><b>This chart uses member data to illustrate member needs according to gender over the months</b> <br>Hovered Data Points: Total number of data & New data for that month according to category</p>
                            </section>
                        </div>
                        <div>
                            <h4>Age vs Fitness Goal Distribution</h4>
                            <canvas id="OverallAgeChart" class="chart" data-description="Description2"></canvas>
                            <section id="Description2" class="chart-description">
                                <p><b>This chart uses member data to illustrate member needs according to age</b> <br>Hovered Data Points: Total number of data & Number of member for each fitness goal according to age category</p>
                            </section>
                        </div>
                        <div>
                            <h4>BMI vs Weight Change Distribution</h4>
                            <canvas id="WeightChangeBmiChart" class="chart" data-description="Description3"></canvas>
                            <section id="Description3" class="chart-description">
                                <p><b>This chart uses member data to illustrate member target according to their BMI so that we can provide realistic suggestions to members in the future</b> <br>Hovered Data Points: Number of member according to BMI category</p>
                            </section>
                        </div>
                    </div>

                    <?php
                    //---------------------------------- 1st CHART --------------------------------------------
                    $sql = "SELECT 
    YEAR(date_registered) AS year,
    CASE 
        WHEN MONTH(date_registered) BETWEEN 1 AND 4 THEN 'Jan-Apr'
        WHEN MONTH(date_registered) BETWEEN 5 AND 8 THEN 'May-Aug'
        ELSE 'Sep-Dec'
    END AS quarter,
    COUNT(CASE WHEN gender = 'male' THEN 1 END) AS male_new,
    COUNT(CASE WHEN gender = 'female' THEN 1 END) AS female_new,
    SUM(CASE WHEN fitness_goal = 'Lose weight' THEN 1 ELSE 0 END) AS lose_weight,
    SUM(CASE WHEN fitness_goal = 'Gain muscle' THEN 1 ELSE 0 END) AS gain_muscle
FROM member 
WHERE YEAR(date_registered) BETWEEN (YEAR(CURDATE()) - 2) AND YEAR(CURDATE())
GROUP BY year, quarter
ORDER BY year, 
    CASE quarter 
        WHEN 'Jan-Apr' THEN 1 
        WHEN 'May-Aug' THEN 2 
        WHEN 'Sep-Dec' THEN 3 
    END";

                    $result = $dbConn->query($sql);
                    $data = $result->fetch_all(MYSQLI_ASSOC);

                    // Cumulative calculations
                    $male_cumulative = 0;
                    $female_cumulative = 0;
                    $lose_weight_cumulative = 0;
                    $gain_muscle_cumulative = 0;

                    // Modify the data array with cumulative totals
                    $processedData = [];
                    foreach ($data as $row) {
                        $male_cumulative += intval($row['male_new']);
                        $female_cumulative += intval($row['female_new']);
                        $lose_weight_cumulative += intval($row['lose_weight']);
                        $gain_muscle_cumulative += intval($row['gain_muscle']);

                        $processedData[] = [
                            'quarter' => $row['quarter'],
                            'year' => $row['year'],
                            'male_new' => intval($row['male_new']),
                            'female_new' => intval($row['female_new']),
                            'lose_weight' => intval($row['lose_weight']),
                            'gain_muscle' => intval($row['gain_muscle']),
                            'male_total' => $male_cumulative,
                            'female_total' => $female_cumulative,
                            'lose_weight_total' => $lose_weight_cumulative,
                            'gain_muscle_total' => $gain_muscle_cumulative
                        ];
                    }

                    // Convert to JSON for JavaScript
                    $jsonData = json_encode($processedData);

                    // ------------------------------2nd CHART: Age Distribution Data---------------------------------
                    $sql2 = "SELECT 
                            SUM(CASE WHEN age < 18 THEN 1 ELSE 0 END) AS under_18,
                            SUM(CASE WHEN age BETWEEN 18 AND 24 THEN 1 ELSE 0 END) AS age_18_24,
                            SUM(CASE WHEN age BETWEEN 25 AND 34 THEN 1 ELSE 0 END) AS age_25_34,
                            SUM(CASE WHEN age BETWEEN 35 AND 44 THEN 1 ELSE 0 END) AS age_35_44,
                            SUM(CASE WHEN age BETWEEN 45 AND 54 THEN 1 ELSE 0 END) AS age_45_54,
                            SUM(CASE WHEN age BETWEEN 55 AND 64 THEN 1 ELSE 0 END) AS age_55_64,
                            SUM(CASE WHEN age >= 65 THEN 1 ELSE 0 END) AS age_65_plus,
                            SUM(CASE WHEN age < 18 AND fitness_goal = 'Lose Weight' THEN 1 ELSE 0 END) AS under_18_lose_weight,
                            SUM(CASE WHEN age < 18 AND fitness_goal = 'Gain muscle' THEN 1 ELSE 0 END) AS under_18_gain_muscle,
                            SUM(CASE WHEN age BETWEEN 18 AND 24 AND fitness_goal = 'Lose Weight' THEN 1 ELSE 0 END) AS age_18_24_lose_weight,
                            SUM(CASE WHEN age BETWEEN 18 AND 24 AND fitness_goal = 'Gain muscle' THEN 1 ELSE 0 END) AS age_18_24_gain_muscle,
                            SUM(CASE WHEN age BETWEEN 25 AND 34 AND fitness_goal = 'Lose Weight' THEN 1 ELSE 0 END) AS age_25_34_lose_weight,
                            SUM(CASE WHEN age BETWEEN 25 AND 34 AND fitness_goal = 'Gain muscle' THEN 1 ELSE 0 END) AS age_25_34_gain_muscle,
                            SUM(CASE WHEN age BETWEEN 35 AND 44 AND fitness_goal = 'Lose Weight' THEN 1 ELSE 0 END) AS age_35_44_lose_weight,
                            SUM(CASE WHEN age BETWEEN 35 AND 44 AND fitness_goal = 'Gain muscle' THEN 1 ELSE 0 END) AS age_35_44_gain_muscle,
                            SUM(CASE WHEN age BETWEEN 45 AND 54 AND fitness_goal = 'Lose Weight' THEN 1 ELSE 0 END) AS age_45_54_lose_weight,
                            SUM(CASE WHEN age BETWEEN 45 AND 54 AND fitness_goal = 'Gain muscle' THEN 1 ELSE 0 END) AS age_45_54_gain_muscle,
                            SUM(CASE WHEN age BETWEEN 55 AND 64 AND fitness_goal = 'Lose Weight' THEN 1 ELSE 0 END) AS age_55_64_lose_weight,
                            SUM(CASE WHEN age BETWEEN 55 AND 64 AND fitness_goal = 'Gain muscle' THEN 1 ELSE 0 END) AS age_55_64_gain_muscle,
                            SUM(CASE WHEN age >= 65 AND fitness_goal = 'Lose Weight' THEN 1 ELSE 0 END) AS age_65_plus_lose_weight,
                            SUM(CASE WHEN age >= 65 AND fitness_goal = 'Gain muscle' THEN 1 ELSE 0 END) AS age_65_plus_gain_muscle
                        FROM member";

                    $result2 = $dbConn->query($sql2);
                    $data2 = $result2->fetch_assoc();

                    //---------------------------------CHART 3----------------------------------------------
                    $sql3 = "SELECT height, weight, target_weight FROM member";
                    $result3 = $dbConn->query($sql3);
                    $data3 = $result3->fetch_all(MYSQLI_ASSOC);

                    // Process the data for BMI and weight change analysis
                    $memberData = [];

                    foreach ($data3 as $row) {
                        if ($row['height'] > 0 && $row['weight'] > 0 && $row['target_weight'] > 0) {
                            $height = $row['height'] / 100; // Convert cm to meters
                            $weight = $row['weight'];
                            $targetWeight = $row['target_weight'];

                            // Calculate BMI
                            $bmi = $weight / ($height * $height);

                            // Calculate weight change (target - current)
                            $weightChange = $targetWeight - $weight;

                            // Store processed data
                            $memberData[] = [
                                'bmi' => $bmi,
                                'weightChange' => $weightChange
                            ];
                        }
                    }

                    // Define weight change values from -4 to 4
                    $weightChangeValues = range(-4, 4);

                    // Define BMI categories
                    $bmiCategories = [
                        ['name' => 'Underweight', 'min' => 0, 'max' => 18.5, 'color' => 'rgba(135, 185, 250, 0.7)'],
                        ['name' => 'Normal weight', 'min' => 18.5, 'max' => 25, 'color' => 'rgba(154, 255, 154, 0.7)'],
                        ['name' => 'Overweight', 'min' => 25, 'max' => 30, 'color' => 'rgba(255, 188, 64, 0.7)'],
                        ['name' => 'Obesity', 'min' => 30, 'max' => 100, 'color' => 'rgba(255, 122, 151, 0.7)']
                    ];

                    // Count members in each BMI category and weight change value
                    $bmiWeightChangeData = [];

                    foreach ($bmiCategories as $category) {
                        $counts = array_fill_keys($weightChangeValues, 0);

                        foreach ($memberData as $member) {
                            if ($member['bmi'] >= $category['min'] && $member['bmi'] < $category['max']) {
                                $weightChange = round($member['weightChange']); // Round to nearest integer
                                if (in_array($weightChange, $weightChangeValues)) {
                                    $counts[$weightChange]++;
                                }
                            }
                        }

                        $bmiWeightChangeData[] = [
                            'category' => $category['name'],
                            'color' => $category['color'],
                            'counts' => array_values($counts)
                        ];
                    }

                    // Convert weight change values into readable labels
                    $weightChangeLabels = array_map(fn($num) => "{$num}kg", $weightChangeValues);

                    ?>

                    <script>
                        document.addEventListener("DOMContentLoaded", function() {
                            //--------------------------------1ST CHART------------------------------------------
                            const ctx1 = document.getElementById('CumulativeGenderChart').getContext('2d');
                            const data = <?php echo $jsonData; ?>;

                            const labels = data.map(item => `${item.quarter} ${item.year}`);
                            const maleTotalData = data.map(item => item.male_total);
                            const femaleTotalData = data.map(item => item.female_total);
                            const loseWeightTotalData = data.map(item => item.lose_weight_total);
                            const gainMuscleTotalData = data.map(item => item.gain_muscle_total);

                            const maleNewData = data.map(item => item.male_new);
                            const femaleNewData = data.map(item => item.female_new);
                            const loseWeightNewData = data.map(item => item.lose_weight);
                            const gainMuscleNewData = data.map(item => item.gain_muscle);

                            new Chart(ctx1, {
                                type: 'bar',
                                data: {
                                    labels: labels,
                                    datasets: [{
                                            label: 'Total Male',
                                            data: maleTotalData,
                                            type: 'line',
                                            borderColor: 'rgb(23, 193, 255)',
                                            backgroundColor: 'rgba(0, 0, 255, 0)',
                                            borderWidth: 2,
                                            pointRadius: 1,
                                            pointHoverRadius: 7,
                                            pointHoverBackgroundColor: 'rgb(23, 193, 255)',
                                            pointHoverBorderColor: 'white',
                                            tension: 0.2,
                                            fill: false,
                                            newData: maleNewData
                                        },
                                        {
                                            label: 'Total Female',
                                            data: femaleTotalData,
                                            type: 'line',
                                            borderColor: 'rgb(255, 23, 185)',
                                            backgroundColor: 'rgba(0, 0, 255, 0)',
                                            borderWidth: 2,
                                            pointRadius: 1,
                                            pointHoverRadius: 7,
                                            pointHoverBackgroundColor: 'rgb(255, 23, 185)',
                                            pointHoverBorderColor: 'white',
                                            tension: 0.2,
                                            fill: false,
                                            newData: femaleNewData
                                        },
                                        {
                                            label: 'Total Lose Weight',
                                            data: loseWeightTotalData,
                                            type: 'bar',
                                            backgroundColor: 'rgb(255, 155, 155)',
                                            newData: loseWeightNewData
                                        },
                                        {
                                            label: 'Total Gain Muscle',
                                            data: gainMuscleTotalData,
                                            type: 'bar',
                                            backgroundColor: 'rgb(255, 223, 135)',
                                            newData: gainMuscleNewData
                                        }
                                    ]
                                },
                                options: {
                                    responsive: true,
                                    plugins: {
                                        tooltip: {
                                            callbacks: {
                                                label: function(tooltipItem) {
                                                    let datasetLabel = tooltipItem.dataset.label;
                                                    let totalValue = tooltipItem.raw;
                                                    let newValue = tooltipItem.dataset.newData[tooltipItem.dataIndex];

                                                    return [
                                                        `Total: ${totalValue}`,
                                                        `This bar: ${newValue}`
                                                    ];
                                                }
                                            }
                                        }
                                    },
                                    scales: {
                                        x: {
                                            ticks: {
                                                callback: function(value, index, values) {
                                                    return labels[index];
                                                }
                                            }
                                        },
                                        y: {
                                            beginAtZero: true
                                        }
                                    }
                                }
                            });

                            //--------------------------------2ND CHART------------------------------------------
                            const ctx2 = document.getElementById('OverallAgeChart').getContext('2d');
                            const ageData = <?php echo json_encode($data2); ?>;

                            const ageCounts = [
                                parseInt(ageData.under_18) || 0,
                                parseInt(ageData.age_18_24) || 0,
                                parseInt(ageData.age_25_34) || 0,
                                parseInt(ageData.age_35_44) || 0,
                                parseInt(ageData.age_45_54) || 0,
                                parseInt(ageData.age_55_64) || 0,
                                parseInt(ageData.age_65_plus) || 0
                            ];

                            const loseWeightData = [
                                parseInt(ageData.under_18_lose_weight) || 0,
                                parseInt(ageData.age_18_24_lose_weight) || 0,
                                parseInt(ageData.age_25_34_lose_weight) || 0,
                                parseInt(ageData.age_35_44_lose_weight) || 0,
                                parseInt(ageData.age_45_54_lose_weight) || 0,
                                parseInt(ageData.age_55_64_lose_weight) || 0,
                                parseInt(ageData.age_65_plus_lose_weight) || 0
                            ];

                            const gainMuscleData = [
                                parseInt(ageData.under_18_gain_muscle) || 0,
                                parseInt(ageData.age_18_24_gain_muscle) || 0,
                                parseInt(ageData.age_25_34_gain_muscle) || 0,
                                parseInt(ageData.age_35_44_gain_muscle) || 0,
                                parseInt(ageData.age_45_54_gain_muscle) || 0,
                                parseInt(ageData.age_55_64_gain_muscle) || 0,
                                parseInt(ageData.age_65_plus_gain_muscle) || 0
                            ];

                            new Chart(ctx2, {
                                type: 'doughnut',
                                data: {
                                    labels: ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65 and over'],
                                    datasets: [{
                                        label: 'Age Distribution',
                                        data: ageCounts,
                                        backgroundColor: [
                                            'rgb(255, 161, 182)',
                                            'rgb(255, 198, 132)',
                                            'rgb(255, 244, 149)',
                                            'rgb(156, 255, 158)',
                                            'rgb(167, 255, 254)',
                                            'rgb(195, 187, 255)',
                                            'rgb(255, 183, 245)'
                                        ],
                                        borderColor: ['rgba(255, 255, 255, 1)'],
                                        borderWidth: 2
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function(tooltipItem) {
                                                    const ageCategory = tooltipItem.label;
                                                    const totalValue = tooltipItem.raw;
                                                    const index = tooltipItem.dataIndex;

                                                    const loseWeight = loseWeightData[index];
                                                    const gainMuscle = gainMuscleData[index];

                                                    return [
                                                        `Total: ${totalValue}`,
                                                        `Lose Weight: ${loseWeight}`,
                                                        `Gain Muscle: ${gainMuscle}`
                                                    ];
                                                }
                                            }
                                        }
                                    }
                                }
                            });

                            //---------------------CHART 3----------------------------------------------
                            const ctx3 = document.getElementById('WeightChangeBmiChart').getContext('2d');
                            const bmiData = <?php echo json_encode($bmiWeightChangeData); ?>;

                            const weightChangeBinLabels = <?php echo json_encode($weightChangeLabels); ?>;
                            const datasets = bmiData.map(category => {
                                return {
                                    label: category.category,
                                    data: category.counts,
                                    backgroundColor: category.color,
                                    borderColor: category.color.replace('0.7', '1'),
                                };
                            });

                            new Chart(ctx3, {
                                type: 'bar',
                                data: {
                                    labels: weightChangeBinLabels,
                                    datasets: datasets
                                },
                                options: {
                                    responsive: true,
                                    scales: {
                                        x: {
                                            stacked: true,
                                            title: {
                                                display: true,
                                                text: 'Weight Change (kg)'
                                            }
                                        },
                                        y: {
                                            stacked: true,
                                            beginAtZero: true,
                                            title: {
                                                display: true,
                                                text: 'Number of Members'
                                            }
                                        }
                                    },
                                    plugins: {
                                        tooltip: {
                                            callbacks: {
                                                label: function(tooltipItem) {
                                                    const bmiCategory = tooltipItem.dataset.label;
                                                    const count = tooltipItem.raw;
                                                    return `${bmiCategory}: ${count} members`;
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                        });
                    </script>

                </div>
                <div class="containers">
                    <h3>Member Activity</h3>
                    <div class="chart">
                        <div>
                            <h4>Fitness Goal vs Level Distribution</h4>
                            <canvas id="levelChart" class="chart" data-description="Description4"></canvas>
                            <section id="Description4" class="chart-description">
                                <p><b>This chart uses member data to illustrate member needs according to their levels so that we can adjust the difficulty in the future</b> <br>Hovered Data Points: Number of member according to fitness goal</p>
                            </section>
                        </div>
                        <div>
                            <h4>Member & Activity Performance Growth</h4>
                            <canvas id="performanceChart" class="chart" data-description="Description5"></canvas>
                            <section id="Description5" class="chart-description">
                                <p><b>This chart uses member & member performance data to show how frequently members use MewFit</b> <br>Hovered Data Points: Member Performance Score/ Total number of members<br><span style="color: red;">Note: Performance score is already divided by 10</span></p>
                            </section>
                        </div>
                        <div>
                            <h4>Age vs Level Distribution</h4>
                            <canvas id="ageChart" class="chart" data-description="Description6"></canvas>
                            <section id="Description6" class="chart-description">
                                <p><b>This chart uses member data to illustrate how active members are according to age so that we can improve to make MewFit more age-friendly</b> <br>Hovered Data Points: Total number of members according to age category</p>
                            </section>
                        </div>
                        <div>
                            <h4>Detailed Performance Distribution</h4>
                            <canvas id="memberPerformanceChart" class="chart" data-description="Description7"></canvas>
                            <section id="Description7" class="chart-description">
                                <p><b>This chart uses member and member performance data to compare how active new and old members are</b> <br>Hovered Data Points: Performance score according to registered date category<br><span style="color: red;">Note: Performance score is already divided by 10</span></p>
                            </section>
                        </div>
                    </div>

                    <?php
                    //-------------------------CHART 1----------------------------------------
                    $sqlLevel = "SELECT 
                            CASE 
                                WHEN level BETWEEN 1 AND 10 THEN '1-10'
                                WHEN level BETWEEN 11 AND 20 THEN '11-20'
                                WHEN level BETWEEN 21 AND 30 THEN '21-30'
                                WHEN level BETWEEN 31 AND 40 THEN '31-40'
                                WHEN level BETWEEN 41 AND 50 THEN '41-50'
                            END AS level_range,
                            SUM(CASE WHEN fitness_goal = 'Lose Weight' THEN 1 ELSE 0 END) AS lose_weight,
                            SUM(CASE WHEN fitness_goal = 'Gain Muscle' THEN 1 ELSE 0 END) AS gain_muscle
                        FROM 
                            member
                        WHERE 
                            level BETWEEN 1 AND 50
                        GROUP BY 
                            level_range
                        ORDER BY 
                            level_range";

                    $resultLevel = $dbConn->query($sqlLevel);
                    $dataLevel = $resultLevel->fetch_all(MYSQLI_ASSOC);

                    //--------------------------------------------CHART 2----------------------------
                    $sqlRegistered1 = "SELECT 
    CONCAT(YEAR(date_registered), '-', LPAD(((MONTH(date_registered)-1) DIV 3)*3 + 1, 2, '0')) AS period,
    COUNT(*) AS registered_count 
FROM member 
GROUP BY period 
ORDER BY period";

                    $resultRegistered = $dbConn->query($sqlRegistered1);
                    $registeredData = [];
                    while ($row = $resultRegistered->fetch_assoc()) {
                        $registeredData[$row['period']] = $row['registered_count'];
                    }

                    // Fetch performance data
                    $sqlPerformance = "SELECT 
    CONCAT(YEAR(weeks_date_mon), '-', LPAD(((MONTH(weeks_date_mon)-1) DIV 3)*3 + 1, 2, '0')) AS period,
    SUM(workout_history_count + diet_history_count) AS total_performance 
FROM member_performance 
GROUP BY period 
ORDER BY period";

                    $resultPerformance = $dbConn->query($sqlPerformance);
                    $performanceData = [];
                    while ($row = $resultPerformance->fetch_assoc()) {
                        $performanceData[$row['period']] = $row['total_performance'];
                    }

                    $periods = array_unique(array_merge(array_keys($registeredData), array_keys($performanceData)));
                    sort($periods);

                    // Format period labels for display
                    $periodLabels = [];
                    foreach ($periods as $period) {
                        list($year, $month) = explode('-', $period);
                        $quarter = '';

                        if ($month == '01') {
                            $quarter = "Jan-Mar $year";
                        } elseif ($month == '04') {
                            $quarter = "Apr-Jun $year";
                        } elseif ($month == '07') {
                            $quarter = "Jul-Sep $year";
                        } elseif ($month == '10') {
                            $quarter = "Oct-Dec $year";
                        }

                        $periodLabels[] = $quarter;
                    }

                    $registeredCounts = [];
                    $cumulativeCount = 0;

                    foreach ($periods as $period) {
                        $cumulativeCount += $registeredData[$period] ?? 0;
                        $registeredCounts[] = $cumulativeCount;
                    }

                    $performanceCounts = [];
                    foreach ($periods as $period) {
                        $performanceCounts[] = $performanceData[$period] ?? 0;
                    }

                    $performanceCounts = array_map(function ($value) {
                        return $value / 10;
                    }, $performanceCounts);

                    //------------------------------------------CHART 3-------------------------------
                    $sqlAgeLevel = "SELECT 
                            CASE 
                                WHEN age < 18 THEN 'Under 18'
                                WHEN age BETWEEN 18 AND 29 THEN '18-29'
                                WHEN age BETWEEN 30 AND 49 THEN '30-49'
                                ELSE '50+' 
                            END AS age_group,
                            CASE 
                                WHEN level BETWEEN 1 AND 10 THEN '1-10'
                                WHEN level BETWEEN 11 AND 20 THEN '11-20'
                                WHEN level BETWEEN 21 AND 30 THEN '21-30'
                                WHEN level BETWEEN 31 AND 40 THEN '31-40'
                                ELSE '41-50'
                            END AS level_range,
                            COUNT(*) AS count
                        FROM 
                            member
                        GROUP BY 
                            age_group, level_range
                        ORDER BY 
                            FIELD(age_group, 'Under 18', '18-29', '30-49', '50+'), 
                            FIELD(level_range, '1-10', '11-20', '21-30', '31-40', '41-50')";

                    $resultAgeLevel = $dbConn->query($sqlAgeLevel);
                    $dataAgeLevel = $resultAgeLevel->fetch_all(MYSQLI_ASSOC);

                    $ageGroups = ['Under 18', '18-29', '30-49', '50+'];
                    $levelRanges = ['1-10', '11-20', '21-30', '31-40', '41-50'];

                    $chartData = [];

                    foreach ($ageGroups as $ageGroup) {
                        $chartData[$ageGroup] = array_fill(0, count($levelRanges), 0);
                    }

                    foreach ($dataAgeLevel as $row) {
                        $ageIndex = array_search($row['age_group'], $ageGroups);
                        $levelIndex = array_search($row['level_range'], $levelRanges);
                        if ($ageIndex !== false && $levelIndex !== false) {
                            $chartData[$row['age_group']][$levelIndex] = $row['count'];
                        }
                    }

                    //-------------------------------------------------------CHART 4-------------------------------
                    $sqlDistinctRegistrationPeriods = "SELECT DISTINCT CONCAT(YEAR(date_registered), '-', 
                                    CASE 
                                        WHEN MONTH(date_registered) BETWEEN 1 AND 3 THEN '01'
                                        WHEN MONTH(date_registered) BETWEEN 4 AND 6 THEN '04'
                                        WHEN MONTH(date_registered) BETWEEN 7 AND 9 THEN '09'
                                        ELSE '12'
                                    END) AS period 
                                    FROM member ORDER BY period";
                    $resultDistinctRegistrationPeriods = $dbConn->query($sqlDistinctRegistrationPeriods);
                    $uniqueRegistrationPeriods = [];

                    while ($row = $resultDistinctRegistrationPeriods->fetch_assoc()) {
                        $uniqueRegistrationPeriods[] = $row['period'];
                    }

                    $performanceDataByPeriod = [];
                    foreach ($uniqueRegistrationPeriods as $currentRegPeriod) {
                        $sqlPerformanceData = "SELECT 
                                CONCAT(YEAR(weeks_date_mon), '-', 
                                    CASE 
                                        WHEN MONTH(weeks_date_mon) BETWEEN 1 AND 3 THEN '01'
                                        WHEN MONTH(weeks_date_mon) BETWEEN 4 AND 6 THEN '04'
                                        WHEN MONTH(weeks_date_mon) BETWEEN 7 AND 9 THEN '09'
                                        ELSE '12'
                                    END) AS period,
                                SUM(workout_history_count + diet_history_count) AS total_performance
                            FROM member_performance
                            WHERE member_id IN (
                                SELECT member_id FROM member WHERE 
                                CONCAT(YEAR(date_registered), '-', 
                                    CASE 
                                        WHEN MONTH(date_registered) BETWEEN 1 AND 3 THEN '01'
                                        WHEN MONTH(date_registered) BETWEEN 4 AND 6 THEN '04'
                                        WHEN MONTH(date_registered) BETWEEN 7 AND 9 THEN '09'
                                        ELSE '12'
                                    END) = '$currentRegPeriod'
                            )
                            GROUP BY period
                            ORDER BY period";

                        $resultPerformanceData = $dbConn->query($sqlPerformanceData);

                        $performanceDataByPeriod[$currentRegPeriod] = [];
                        while ($row = $resultPerformanceData->fetch_assoc()) {
                            $performanceDataByPeriod[$currentRegPeriod][$row['period']] = $row['total_performance'] / 10;
                        }
                    }

                    $allUniquePeriods = [];
                    foreach ($performanceDataByPeriod as $data) {
                        $allUniquePeriods = array_merge($allUniquePeriods, array_keys($data));
                    }
                    $allUniquePeriods = array_unique($allUniquePeriods);
                    sort($allUniquePeriods);

                    $chartDatasets = [];
                    foreach ($uniqueRegistrationPeriods as $currentRegPeriod) {
                        $dataPointsForPeriod = [];

                        foreach ($allUniquePeriods as $currentPeriod) {
                            if (strcmp($currentPeriod, $currentRegPeriod) < 0) {
                                $dataPointsForPeriod[] = null;
                            } else {
                                $dataPointsForPeriod[] = $performanceDataByPeriod[$currentRegPeriod][$currentPeriod] ?? 0;
                            }
                        }

                        $chartDatasets[] = [
                            "label" => "Member registered " . $currentRegPeriod,
                            "data" => $dataPointsForPeriod
                        ];
                    }



                    ?>

                    <script>
                        document.addEventListener("DOMContentLoaded", function() {
                            //------------------------CHART 1------------------------------
                            const ctxLevel = document.getElementById('levelChart').getContext('2d');
                            const levelData3 = <?php echo json_encode($dataLevel); ?>;

                            const levelLabels = levelData3.map(item => item.level_range);
                            const loseWeightData = levelData3.map(item => parseInt(item.lose_weight) || 0);
                            const gainMuscleData = levelData3.map(item => parseInt(item.gain_muscle) || 0);

                            new Chart(ctxLevel, {
                                type: 'bar',
                                data: {
                                    labels: levelLabels,
                                    datasets: [{
                                            label: 'Lose Weight',
                                            data: loseWeightData,
                                            backgroundColor: 'rgb(255, 155, 155)',
                                        },
                                        {
                                            label: 'Gain Muscle',
                                            data: gainMuscleData,
                                            backgroundColor: 'rgb(255, 223, 135)',
                                        }
                                    ]
                                },
                                options: {
                                    responsive: true,
                                    scales: {
                                        x: {
                                            stacked: true,
                                            title: {
                                                display: true,
                                                text: 'Level Range'
                                            }
                                        },
                                        y: {
                                            stacked: true,
                                            beginAtZero: true,
                                            title: {
                                                display: true,
                                                text: 'Number of Members'
                                            }
                                        }
                                    }
                                }
                            });


                            //------------------------CHART 2-----------------------------
                            const ctx6 = document.getElementById('performanceChart').getContext('2d');
                            const periodLabels = <?php echo json_encode($periodLabels); ?>;
                            const registeredData = <?php echo json_encode($registeredCounts, JSON_NUMERIC_CHECK); ?>;
                            const performanceData = <?php echo json_encode($performanceCounts, JSON_NUMERIC_CHECK); ?>;

                            new Chart(ctx6, {
                                type: 'bar',
                                data: {
                                    labels: periodLabels,
                                    datasets: [{
                                            label: 'Member Performance',
                                            data: performanceData,
                                            borderColor: 'rgb(255, 131, 158)',
                                            backgroundColor: 'rgb(255, 131, 158)',
                                            borderWidth: 1,
                                            type: 'line',
                                            yAxisID: 'y1'
                                        },
                                        {
                                            label: 'Total Number of Members',
                                            data: registeredData,
                                            backgroundColor: 'rgb(159, 247, 255)',
                                            borderColor: 'rgba(159, 247, 255, 0.7)',
                                            borderWidth: 2,
                                            pointRadius: 2,
                                            yAxisID: 'y'
                                        }
                                    ]
                                },
                                options: {
                                    responsive: true,
                                    scales: {
                                        x: {
                                            title: {
                                                display: true,
                                                text: 'Date Range'
                                            }
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Number of Members'
                                            },
                                            beginAtZero: true
                                        },
                                        y1: {
                                            title: {
                                                display: true,
                                                text: 'Performance'
                                            },
                                            beginAtZero: true,
                                            position: 'right',
                                            grid: {
                                                drawOnChartArea: false
                                            }
                                        }
                                    }
                                }
                            });
                            //-----------------------------CHART 3----------------------------------
                            const ctxBar = document.getElementById('ageChart').getContext('2d');

                            const levelLabels2 = <?php echo json_encode($levelRanges); ?>;
                            const ageGroupData = <?php echo json_encode(array_values($chartData), JSON_NUMERIC_CHECK); ?>;
                            const ageGroupLabels = <?php echo json_encode(array_keys($chartData)); ?>;

                            const customColors = {
                                'Under 18': 'rgb(255, 206, 241)',
                                '18-29': 'rgb(255, 210, 151)',
                                '30-49': 'rgb(192, 228, 255)',
                                '50+': 'rgb(215, 197, 255)'
                            };

                            new Chart(ctxBar, {
                                type: 'bar',
                                data: {
                                    labels: levelLabels2,
                                    datasets: ageGroupLabels.map((ageGroup) => ({
                                        label: ageGroup,
                                        data: ageGroupData[ageGroupLabels.indexOf(ageGroup)],
                                        backgroundColor: customColors[ageGroup],
                                        borderColor: customColors[ageGroup].replace('0.5', '1'), // Make border color opaque
                                        borderWidth: 1
                                    }))
                                },
                                options: {
                                    responsive: true,
                                    scales: {
                                        x: {
                                            title: {
                                                display: true,
                                                text: 'Level Ranges'
                                            }
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Number of member'
                                            },
                                            beginAtZero: true
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            position: 'top'
                                        }
                                    }
                                }
                            });

                            //--------------------------------CHART 4----------------------------------
                            const ctxMemberPerformance = document.getElementById('memberPerformanceChart').getContext('2d');

                            const performancePeriods = <?php echo json_encode($allUniquePeriods); ?>;
                            const performanceDatasets = <?php echo json_encode($chartDatasets, JSON_NUMERIC_CHECK); ?>;

                            console.log(performancePeriods);
                            console.log(performanceDatasets);

                            function generateColor(index) {
                                const colorPalette = [
                                    'rgb(255, 160, 180)', 'rgb(128, 204, 255)',
                                    'rgb(255, 207, 86)', 'rgb(179, 255, 156)',
                                    'rgb(212, 191, 255)', 'rgb(255, 160, 64)'
                                ];
                                return colorPalette[index % colorPalette.length];
                            }

                            new Chart(ctxMemberPerformance, {
                                type: 'line',
                                data: {
                                    labels: performancePeriods,
                                    datasets: performanceDatasets.map((dataset, index) => ({
                                        ...dataset,
                                        borderColor: generateColor(index),
                                        backgroundColor: "rgba(179, 255, 156, 0)",
                                        borderWidth: 2,
                                        tension: 0.05,
                                        pointRadius: 1,
                                        pointHoverRadius: 5,
                                        pointHoverBackgroundColor: generateColor(index),
                                        fill: true
                                    }))
                                },
                                options: {
                                    responsive: true,
                                    scales: {
                                        x: {
                                            title: {
                                                display: true,
                                                text: 'Date range'
                                            }
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Performance Score'
                                            },
                                            beginAtZero: true
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            position: 'top'
                                        }
                                    }
                                }
                            });

                        });
                    </script>
                </div>
            </div>
        </section>

        <!-- workout analysis -->
        <section>
            <h2>Workout Analysis</h2>
            <div>
                <div class="containers">
                    <div class="chart">
                        <div>
                            <h4>Members' Preferences on Workout Type</h4>
                            <canvas id="workoutPopularityChart" class="chart" data-description="Description8"></canvas>
                            <section id="Description8" class="chart-description">
                                <p><b>This chart uses workout and workout history data to see which workout category do members prefer</b> <br>Hovered Data Points: Number of times the workouts has been clicked according to workout type</p>
                            </section>
                        </div>
                        <div>
                            <h4>Member's Preference on Duration</h4>
                            <div>
                                <canvas id="durationChart" class="chart" data-description="Description9"></canvas>
                                <section id="Description9" class="chart-description">
                                    <p><b>This chart uses workout and workout history data to see which duration do members prefer for each workout category</b> <br><span style="color:red;">Look for the highest/lowest number of clicks for each colored dot</span></p>
                                </section>
                            </div>

                        </div>
                        <div>
                            <h4>Member's Preference on Calories</h4>
                            <div>
                                <canvas id="caloriesChart" class="chart" data-description="Description10"></canvas>
                                <section id="Description10" class="chart-description">
                                    <p><b>This chart uses workout and workout history data to see how many calories burnt do members prefer for each workout category</b> <br><span style="color:red;">Look for the highest/lowest number of clicks for each colored dot</span></p>
                                </section>
                            </div>
                        </div>
                        <div>
                            <h4>Workout & Member Performance Growth</h4>
                            <canvas id="workoutPerformanceChart" class="chart" data-description="Description11"></canvas>
                            <section id="Description11" class="chart-description">
                                <p><b>This chart uses workout and member performance data to see how the increasing number of each workout category affect member performance</b> <br>Hovered Data Points: Total number of workout according to workout category<br><span style="color:red;">Note: Performance score is already divided by 10</span></p>
                            </section>
                        </div>
                    </div>
                </div>

                <?php
                $sqlWorkoutTypes = "SELECT DISTINCT workout_type FROM workout";
                $resultWorkoutTypes = $dbConn->query($sqlWorkoutTypes);

                $workoutTypes = [];
                while ($row = $resultWorkoutTypes->fetch_assoc()) {
                    $workoutTypes[] = ucfirst($row['workout_type']);
                }

                $workoutData = [];
                foreach ($workoutTypes as $type) {
                    $sqlHistory = "SELECT COUNT(workout_history_id) AS workout_count
                FROM workout_history
                WHERE workout_id IN (
                    SELECT workout_id FROM workout WHERE workout_type = LOWER('$type')
                )";

                    $resultHistory = $dbConn->query($sqlHistory);
                    $workoutData[$type] = $resultHistory->fetch_assoc()['workout_count'] ?? 0;
                }

                $colors = [
                    "Cardio" => "rgb(255, 149, 172)",
                    "Weighted" => "rgb(132, 206, 255)",
                    "Weight-free" => "rgb(255, 219, 128)",
                    "Yoga" => "rgb(218, 169, 255)"
                ];

                $dataset = [
                    "labels" => array_keys($workoutData),
                    "data" => array_values($workoutData),
                    "backgroundColor" => []
                ];

                foreach (array_keys($workoutData) as $type) {
                    $dataset["backgroundColor"][] = $colors[$type] ?? "rgb(200, 200, 200)";
                }

                // CHART 2 and 3

                $sqlWorkoutData = "SELECT 
w.workout_type,
w.calories,
w.duration,
COUNT(wh.workout_id) AS workout_count
FROM workout w
LEFT JOIN workout_history wh ON w.workout_id = wh.workout_id
WHERE w.workout_type IN ('Weighted', 'Yoga', 'Weight-free', 'Cardio')
GROUP BY w.workout_type, w.calories, w.duration";

                $resultWorkoutData = $dbConn->query($sqlWorkoutData);

                $workoutData = [
                    'Weighted' => [],
                    'Yoga' => [],
                    'Weight-free' => [],
                    'Cardio' => []
                ];

                while ($row = $resultWorkoutData->fetch_assoc()) {
                    $workoutType = ucfirst($row['workout_type']);
                    $workoutData[$workoutType][] = [
                        'calories' => $row['calories'],
                        'duration' => $row['duration'],
                        'workout_count' => $row['workout_count']
                    ];
                }

                // CHART 4
                $sqlDistinctWorkoutTypes = "SELECT DISTINCT workout_type FROM workout";
                $resultDistinctWorkoutTypes = $dbConn->query($sqlDistinctWorkoutTypes);

                $allWorkoutTypes = [];
                while ($row = $resultDistinctWorkoutTypes->fetch_assoc()) {
                    $allWorkoutTypes[] = ucfirst($row['workout_type']);
                }

                $workoutCountsByType = [];
                $performanceDataByPeriod = [];
                $allTimePeriods = [];

                foreach ($allWorkoutTypes as $currentWorkoutType) {
                    $sqlWorkoutHistoryByType = "SELECT 
                                    CONCAT(YEAR(date), '-', LPAD(((MONTH(date)-1) DIV 4)*4 + 1, 2, '0')) AS period,
                                    COUNT(workout_history_id) AS total_workout_count
                                FROM workout_history
                                WHERE workout_id IN (
                                    SELECT workout_id FROM workout WHERE workout_type = LOWER('$currentWorkoutType')
                                )
                                GROUP BY period
                                ORDER BY period";

                    $resultWorkoutHistory = $dbConn->query($sqlWorkoutHistoryByType);

                    $workoutCountsByType[$currentWorkoutType] = [];
                    $cumulativeWorkoutCount = 0;
                    while ($row = $resultWorkoutHistory->fetch_assoc()) {
                        $cumulativeWorkoutCount += $row['total_workout_count'];
                        $workoutCountsByType[$currentWorkoutType][$row['period']] = $cumulativeWorkoutCount;
                        $allTimePeriods[] = $row['period'];
                    }
                }

                $sqlMemberPerformance = "SELECT 
                            CONCAT(YEAR(weeks_date_mon), '-', LPAD(((MONTH(weeks_date_mon)-1) DIV 6)*6 + 1, 2, '0')) AS period,
                            SUM(workout_history_count) AS total_performance
                        FROM member_performance
                        GROUP BY period
                        ORDER BY period";

                $resultMemberPerformance = $dbConn->query($sqlMemberPerformance);
                while ($row = $resultMemberPerformance->fetch_assoc()) {
                    $performanceDataByPeriod[$row['period']] = $row['total_performance'] / 10;
                }

                $allTimePeriods = array_unique($allTimePeriods);
                sort($allTimePeriods);

                $chartDataSets = [];
                $performanceDataPoints = [];
                foreach ($allTimePeriods as $currentPeriod) {
                    $performanceDataPoints[] = $performanceDataByPeriod[$currentPeriod] ?? 0;
                }
                $chartDataSets[] = [
                    "label" => "Member Performance",
                    "type" => "line",
                    "data" => $performanceDataPoints,
                    "backgroundColor" => "rgb(235, 61, 61)",
                    "borderColor" => "rgb(235, 61, 61)",
                    "pointRadius" => 1,
                    "pointHoverRadius" => 4,
                    "borderWidth" => 2,
                    "fill" => false
                ];

                $workoutTypeColors = [
                    "Cardio" => "rgb(255, 149, 172)",
                    "Weighted" => "rgb(132, 206, 255)",
                    "Weight-free" => "rgb(255, 219, 128)",
                    "Yoga" => "rgb(218, 169, 255)"
                ];

                foreach ($allWorkoutTypes as $currentWorkoutType) {
                    $dataPointsForCurrentType = [];
                    $cumulativeValueForCurrentType = 0;

                    foreach ($allTimePeriods as $currentPeriod) {
                        if (isset($workoutCountsByType[$currentWorkoutType][$currentPeriod])) {
                            $cumulativeValueForCurrentType = $workoutCountsByType[$currentWorkoutType][$currentPeriod];
                        }
                        $dataPointsForCurrentType[] = $cumulativeValueForCurrentType;
                    }

                    $chartDataSets[] = [
                        "label" => ucfirst($currentWorkoutType),
                        "type" => "bar",
                        "data" => $dataPointsForCurrentType,
                        "backgroundColor" => $workoutTypeColors[$currentWorkoutType] ?? "rgb(200, 200, 200)",
                        "borderColor" => str_replace("0.6", "1", $workoutTypeColors[$currentWorkoutType] ?? "rgb(200, 200, 200)"),
                        "borderWidth" => 1
                    ];
                }
                ?>

                <script>
                    document.addEventListener("DOMContentLoaded", function() {
                        //-----------------------------------CHART 1-----------------------------------
                        const ctx = document.getElementById('workoutPopularityChart').getContext('2d');

                        new Chart(ctx, {
                            type: 'polarArea',
                            data: {
                                labels: <?php echo json_encode($dataset["labels"]); ?>,
                                datasets: [{
                                    label: "Workout Popularity",
                                    data: <?php echo json_encode($dataset["data"], JSON_NUMERIC_CHECK); ?>,
                                    backgroundColor: <?php echo json_encode($dataset["backgroundColor"]); ?>
                                }]
                            },
                            options: {
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top'
                                    }
                                }
                            }
                        });

                        //-----------------------------CHART 2 and 3----------------------------------------
                        const workoutData = <?php echo json_encode($workoutData); ?>;

                        function createScatterChart(canvasId, xAxisLabel, xAxisDataKey, data) {
                            const ctx8 = document.getElementById(canvasId).getContext('2d');

                            new Chart(ctx8, {
                                type: 'scatter',
                                data: {
                                    datasets: [{
                                            label: 'Weighted',
                                            data: data.Weighted.map(workout => ({
                                                x: workout[xAxisDataKey],
                                                y: workout.workout_count
                                            })),
                                            backgroundColor: 'rgb(132, 206, 255)',
                                            borderColor: 'rgb(132, 206, 255)',
                                            pointRadius: 4,
                                            pointHoverRadius: 6
                                        },
                                        {
                                            label: 'Yoga',
                                            data: data.Yoga.map(workout => ({
                                                x: workout[xAxisDataKey],
                                                y: workout.workout_count
                                            })),
                                            backgroundColor: 'rgb(218, 169, 255)',
                                            borderColor: 'rgb(218, 169, 255)',
                                            pointRadius: 4,
                                            pointHoverRadius: 6
                                        },
                                        {
                                            label: 'Weight-Free',
                                            data: data["Weight-free"].map(workout => ({
                                                x: workout[xAxisDataKey],
                                                y: workout.workout_count
                                            })),
                                            backgroundColor: 'rgb(255, 219, 128)',
                                            borderColor: 'rgb(255, 219, 128)',
                                            pointRadius: 4,
                                            pointHoverRadius: 6
                                        },
                                        {
                                            label: 'Cardio',
                                            data: data.Cardio.map(workout => ({
                                                x: workout[xAxisDataKey],
                                                y: workout.workout_count
                                            })),
                                            backgroundColor: 'rgb(255, 149, 172)',
                                            borderColor: 'rgb(255, 149, 172)',
                                            pointRadius: 4,
                                            pointHoverRadius: 6
                                        }
                                    ]
                                },
                                options: {
                                    responsive: true,
                                    scales: {
                                        x: {
                                            title: {
                                                display: true,
                                                text: xAxisLabel
                                            },
                                            type: 'linear',
                                            position: 'bottom'
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Number of Clicks'
                                            }
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            display: true,
                                            position: 'top'
                                        }
                                    }
                                }
                            });
                        }

                        createScatterChart('durationChart', 'Duration (minutes)', 'duration', workoutData);
                        createScatterChart('caloriesChart', 'Calories', 'calories', workoutData);

                        //-----------------------------CHART 4----------------------------------------
                        const ctx9 = document.getElementById('workoutPerformanceChart').getContext('2d');

                        const allTimeLabels = <?php echo json_encode($allTimePeriods); ?>;
                        const chartDataSets = <?php echo json_encode($chartDataSets, JSON_NUMERIC_CHECK); ?>;

                        new Chart(ctx9, {
                            type: 'bar',
                            data: {
                                labels: allTimeLabels,
                                datasets: chartDataSets
                            },
                            options: {
                                responsive: true,
                                scales: {
                                    x: {
                                        title: {
                                            display: true,
                                            text: 'Date'
                                        }
                                    },
                                    y: {
                                        title: {
                                            display: true,
                                            text: 'Total Number of Workouts'
                                        },
                                        beginAtZero: true
                                    }
                                },
                                plugins: {
                                    legend: {
                                        position: 'top'
                                    }
                                }
                            }
                        });
                    });
                </script>

            </div>
        </section>

        <!-- meal analysis -->
        <!-- diet analysis -->
        <section>
            <h2>Meal Analysis</h2>
            <div>
                <div class="containers">
                    <h3>Diet Analysis</h3>
                    <div class="chart">
                        <div>
                            <h4>Members' Preference on Diet Type</h4>
                            <canvas id="dietPopularityChart" class="chart" data-description="Description12"></canvas>
                            <section id="Description12" class="chart-description">
                                <p><b>This chart uses diet and diet history data to see which diet category do members prefer</b> <br>Hovered Data Points: Number of times the diet has been clicked according to diet type</p>
                            </section>
                        </div>
                        <div>
                            <h4>Member's Preference on Preparation Time</h4>
                            <div>
                                <canvas id="preparationTimeChart" width="500" height="300" class="chart" data-description="Description13"></canvas>
                                <section id="Description13" class="chart-description">
                                    <p><b>This chart uses diet and diet history data to see which preparation time do members prefer for each diet category</b> <br><span style="color:red;">Look for the highest/lowest number of clicks for each colored dot</span></p>
                                </section>
                            </div>
                        </div>
                        <div>
                            <h4>Member's Preference on Calories</h4>
                            <div>
                                <canvas id="dietCalorieChart" width="500" height="300" class="chart" data-description="Description14"></canvas>
                                <section id="Description14" class="chart-description">
                                    <p><b>This chart uses diet and diet history data to see which calories do members prefer for each diet category</b> <br><span style="color:red;">Look for the highest/lowest number of clicks for each colored dot</span></p>
                                </section>
                            </div>
                        </div>
                        <div>
                            <h4>Diet vs Member Performance</h4>
                            <canvas id="dietPerformanceChart" class="chart" data-description="Description15"></canvas>
                            <section id="Description15" class="chart-description">
                                <p><b>This chart uses diet and member performance data to see how the increasing number of each diet category affect member performance</b> <br>Hovered Data Points: Total number of diet according to diet category<br><span style="color:red;">Note: Performance score is already divided by 10</span></p>
                            </section>
                        </div>
                    </div>
                </div>
                <!-- ----------------------------------CHART 1-------------------------- -->
                <?php
                $sqlDistinctDietTypes = "SELECT DISTINCT diet_type FROM diet";
                $resultDistinctDietTypes = $dbConn->query($sqlDistinctDietTypes);

                $allDietTypes = [];
                while ($row = $resultDistinctDietTypes->fetch_assoc()) {
                    $allDietTypes[] = $row['diet_type'];
                }

                $dietCountsByType = [];
                foreach ($allDietTypes as $currentDietType) {
                    $sqlDietHistory = "SELECT COUNT(diet_history_id) AS total_diet_count
                                        FROM diet_history
                                        WHERE diet_id IN (
                                            SELECT diet_id FROM diet WHERE diet_type = '$currentDietType'
                                        )";

                    $resultDietHistory = $dbConn->query($sqlDietHistory);
                    $dietCountsByType[$currentDietType] = $resultDietHistory->fetch_assoc()['total_diet_count'] ?? 0;
                }

                $dietColors = [
                    "all" => "rgba(247, 195, 64, 0.85)",
                    "vegetarian" => "rgba(94, 119, 233, 0.85)",
                    "vegan" => "rgba(111, 212, 119, 0.85)",
                    "meat" => "rgba(255, 99, 132, 0.85)",
                ];

                $dietChartDataset = [
                    "labels" => array_keys($dietCountsByType),
                    "data" => array_values($dietCountsByType),
                    "backgroundColor" => array_map(fn($type) => $dietColors[$type] ?? "rgba(200, 200, 200, 0.85)", array_keys($dietCountsByType)),
                ];
                ?>
                <script>
                    document.addEventListener("DOMContentLoaded", function() {
                        console.log("loading");
                        const ctxDietChart = document.getElementById('dietPopularityChart').getContext('2d');

                        new Chart(ctxDietChart, {
                            type: 'polarArea',
                            data: {
                                labels: <?php echo json_encode($dietChartDataset["labels"]); ?>,
                                datasets: [{
                                    label: "Diet Popularity",
                                    data: <?php echo json_encode($dietChartDataset["data"], JSON_NUMERIC_CHECK); ?>,
                                    backgroundColor: <?php echo json_encode($dietChartDataset["backgroundColor"]); ?>
                                }]
                            },
                            options: {
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top'
                                    }
                                }
                            }
                        });
                    });
                </script>
                <!-- ----------------------------------CHART 2 AND 3-------------------------- -->
                <?php
                $sqlDietStatistics = "SELECT 
                                            d.diet_type,
                                            SUM(n.calories) AS total_calories,
                                            d.preparation_min,
                                            COUNT(dh.diet_id) AS total_diet_count
                                        FROM diet d
                                        LEFT JOIN diet_nutrition dn ON d.diet_id = dn.diet_id
                                        LEFT JOIN nutrition n ON dn.nutrition_id = n.nutrition_id
                                        LEFT JOIN diet_history dh ON d.diet_id = dh.diet_id
                                        GROUP BY d.diet_type, d.diet_id, d.preparation_min";

                $resultDietStatistics = $dbConn->query($sqlDietStatistics);

                while ($row = $resultDietStatistics->fetch_assoc()) {
                    $currentDietType = $row['diet_type'];

                    // Make sure the diet type exists in our array
                    if (!isset($dietStatistics[$currentDietType])) {
                        $dietStatistics[$currentDietType] = [];
                    }

                    $dietStatistics[$currentDietType][] = [
                        'calories' => (int)$row['total_calories'],
                        'preparation_min' => (int)$row['preparation_min'],
                        'total_diet_count' => (int)$row['total_diet_count']
                    ];
                }

                // Create JavaScript-friendly variable names
                $jsVariableNames = [
                    'Vegetarian' => 'vegetarian',
                    'Vegan' => 'vegan',
                    'Meat' => 'meat',
                    'All' => 'all',
                ];

                // Convert PHP array keys to match JavaScript expected keys
                $jsDietStatistics = [];
                foreach ($dietStatistics as $dietType => $data) {
                    $jsKey = isset($jsVariableNames[$dietType]) ? $jsVariableNames[$dietType] : strtolower(str_replace(' ', '', $dietType));
                    $jsDietStatistics[$jsKey] = $data;
                }
                ?>

                <script>
                    document.addEventListener("DOMContentLoaded", function() {
                        // Get data from PHP
                        const dietStatistics = <?php echo json_encode($jsDietStatistics); ?>;

                        function createScatterChart(canvasId, xAxisLabel, xAxisDataKey, data) {
                            const ctx = document.getElementById(canvasId).getContext('2d');

                            // Prepare datasets dynamically based on available data
                            const datasets = [];
                            const colors = {
                                'vegetarian': 'rgba(94, 119, 233, 0.85)',
                                'vegan': 'rgba(111, 212, 119, 0.85)',
                                'meat': 'rgba(255, 99, 132, 0.85)',
                                'all': 'rgba(247, 195, 64, 0.85)',
                            };

                            // Only create datasets for diet types that have data
                            Object.keys(data).forEach(dietType => {
                                if (data[dietType] && data[dietType].length > 0) {
                                    const displayName = dietType.charAt(0).toUpperCase() + dietType.slice(1)
                                        .replace(/([A-Z])/g, ' $1').trim(); // Convert camelCase to Title Case with spaces

                                    datasets.push({
                                        label: displayName,
                                        data: data[dietType].map(diet => ({
                                            x: diet[xAxisDataKey],
                                            y: diet.total_diet_count
                                        })),
                                        backgroundColor: colors[dietType] || `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`,
                                        borderColor: colors[dietType] || `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`,
                                        pointRadius: 4,
                                        pointHoverRadius: 6
                                    });
                                }
                            });

                            const scatterChart = new Chart(ctx, {
                                type: 'scatter',
                                data: {
                                    datasets: datasets
                                },
                                options: {
                                    responsive: true,
                                    scales: {
                                        x: {
                                            title: {
                                                display: true,
                                                text: xAxisLabel
                                            },
                                            type: 'linear',
                                            position: 'bottom'
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Number of Clicks'
                                            }
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            display: true,
                                            position: 'top'
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function(context) {
                                                    return `${context.dataset.label}: (${context.parsed.x}, ${context.parsed.y})`;
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                        }

                        // Create the charts if data exists
                        if (document.getElementById('preparationTimeChart')) {
                            createScatterChart('preparationTimeChart', 'Preparation Time (minutes)', 'preparation_min', dietStatistics);
                        }

                        if (document.getElementById('dietCalorieChart')) {
                            createScatterChart('dietCalorieChart', 'Calories', 'calories', dietStatistics);
                        }
                    });
                </script>
                <!-- ----------------------------------CHART 4-------------------------- -->
                <?php
                $sqlDistinctDietTypes = "SELECT DISTINCT diet_type FROM diet";
                $resultDistinctDietTypes = $dbConn->query($sqlDistinctDietTypes);

                $allDietTypes = [];
                while ($row = $resultDistinctDietTypes->fetch_assoc()) {
                    $allDietTypes[] = $row['diet_type'];
                }

                $dietCountsByType = [];
                $performanceDataByPeriod = [];
                $allTimePeriods = [];

                $cumulativeDietCountsByType = [];
                foreach ($allDietTypes as $currentDietType) {
                    $sqlDietHistoryByType = "SELECT 
                                                    CONCAT(YEAR(date), '-', LPAD(((MONTH(date)-1) DIV 4)*4 + 1, 2, '0')) AS period,
                                                    COUNT(diet_history_id) AS total_diet_count
                                                FROM diet_history
                                                WHERE diet_id IN (
                                                    SELECT diet_id FROM diet WHERE diet_type = '$currentDietType'
                                                )
                                                GROUP BY period
                                                ORDER BY period";

                    $resultDietHistory = $dbConn->query($sqlDietHistoryByType);

                    $dietCountsByType[$currentDietType] = [];
                    $cumulativeDietCount = 0;
                    while ($row = $resultDietHistory->fetch_assoc()) {
                        $cumulativeDietCount += $row['total_diet_count'];
                        $dietCountsByType[$currentDietType][$row['period']] = $cumulativeDietCount;
                        $allTimePeriods[] = $row['period'];
                    }
                }

                $sqlMemberPerformance = "SELECT 
                                                CONCAT(YEAR(weeks_date_mon), '-', LPAD(((MONTH(weeks_date_mon)-1) DIV 4)*4 + 1, 2, '0')) AS period,
                                                SUM(diet_history_count) AS total_performance
                                            FROM member_performance
                                            GROUP BY period
                                            ORDER BY period";

                $resultMemberPerformance = $dbConn->query($sqlMemberPerformance);
                while ($row = $resultMemberPerformance->fetch_assoc()) {
                    $performanceDataByPeriod[$row['period']] = $row['total_performance'] / 10;
                }

                $allTimePeriods = array_unique($allTimePeriods);
                sort($allTimePeriods);

                $chartDataSets = [];
                $performanceDataPoints = [];
                foreach ($allTimePeriods as $currentPeriod) {
                    $performanceDataPoints[] = $performanceDataByPeriod[$currentPeriod] ?? 0;
                }
                $chartDataSets[] = [
                    "label" => "Member Performance",
                    "type" => "line",
                    "data" => $performanceDataPoints,
                    "backgroundColor" => "rgb(235, 61, 61)",
                    "borderColor" => "rgb(235, 61, 61)",
                    "pointRadius" => 1,
                    "pointHoverRadius" => 4,
                    "borderWidth" => 2,
                    "fill" => false
                ];

                $dietTypeColors = [
                    "all" => "rgba(247, 195, 64, 0.85)",
                    "vegetarian" => "rgba(94, 119, 233, 0.85)",
                    "vegan" => "rgba(111, 212, 119, 0.85)",
                    "meat" => "rgba(255, 99, 132, 0.85)",
                ];

                foreach ($allDietTypes as $currentDietType) {
                    $dataPointsForCurrentType = [];
                    $cumulativeValueForCurrentType = 0;

                    foreach ($allTimePeriods as $currentPeriod) {
                        if (isset($dietCountsByType[$currentDietType][$currentPeriod])) {
                            $cumulativeValueForCurrentType = $dietCountsByType[$currentDietType][$currentPeriod];
                        }
                        $dataPointsForCurrentType[] = $cumulativeValueForCurrentType;
                    }

                    $chartDataSets[] = [
                        "label" => ucfirst($currentDietType),
                        "type" => "bar",
                        "data" => $dataPointsForCurrentType,
                        "backgroundColor" => $dietTypeColors[strtolower($currentDietType)] ?? "rgba(200, 200, 200, 0.85)", // Default color if not found
                        "borderColor" => str_replace("0.85", "1", $dietTypeColors[strtolower($currentDietType)] ?? "rgba(200, 200, 200, 1)"),
                        "borderWidth" => 1
                    ];
                }
                ?>

                <script>
                    const ctx9 = document.getElementById('dietPerformanceChart').getContext('2d');

                    const allTimeLabels = <?php echo json_encode($allTimePeriods); ?>; // Updated variable name
                    const chartDataSets = <?php echo json_encode($chartDataSets, JSON_NUMERIC_CHECK); ?>; // Updated variable name

                    new Chart(ctx9, {
                        type: 'bar',
                        data: {
                            labels: allTimeLabels,
                            datasets: chartDataSets
                        },
                        options: {
                            responsive: true,
                            scales: {
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Date'
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: 'Total Number of Diets'
                                    },
                                    beginAtZero: true
                                }
                            },
                            plugins: {
                                legend: {
                                    position: 'top'
                                }
                            }
                        }
                    });
                </script>

                <!-- ---------------------------------nutrition analysis------------------------- -->
                <div class="containers">
                    <h3>Ingredients Analysis</h3>
                    <div class="chart">
                        <div>
                            <h4>Top 10 Member's Favourite</h4>
                            <canvas id="nutritionPopularityChart" class="chart" data-description="Description16"></canvas>
                            <section id="Description16" class="chart-description">
                                <p><b>This chart uses nutrition and diet data to see which ingredients do members prefer</b><br>Hovered Data Points: Nutrition information <br><span style="color:red;">The calorie amount has been divided by 10</span></p>
                            </section>
                        </div>
                        <div>
                            <h4>Nutrition & Member Performance Growth</h4>
                            <canvas id="nutritionPerformanceChart" class="chart" data-description="Description17"></canvas>
                            <section id="Description17" class="chart-description">
                                <p><b>This chart uses nutrition, diet, and member performance data to see how the increasing number of each nutrition category affect member performance</b><br>Hovered Data Points: Nutrition information/ Performance score <br><span style="color:red;">Note: Performance score and calorie amount is already divided by 10</span></p>
                            </section>
                        </div>
                    </div>
                </div>
                <!-- ----------------------------------CHART 1-------------------------- -->
                <?php
                $sqlTopNutrition = "
                    SELECT dn.nutrition_id, n.nutrition_name, 
                        n.calories AS total_calories,
                        n.fat AS total_fat,
                        n.protein AS total_protein,
                        n.carbohydrate AS total_carbohydrate,
                        COUNT(dn.nutrition_id) AS usage_count
                    FROM diet_nutrition dn
                    JOIN nutrition n ON dn.nutrition_id = n.nutrition_id
                    GROUP BY dn.nutrition_id
                    ORDER BY usage_count DESC
                    LIMIT 10";

                $resultTopNutrition = $dbConn->query($sqlTopNutrition);

                $nutritionLabels = [];
                $caloriesData = [];
                $fatData = [];
                $proteinData = [];
                $carbohydrateData = [];

                while ($row = $resultTopNutrition->fetch_assoc()) {
                    $nutritionLabels[] = $row['nutrition_name'];
                    $caloriesData[] = $row['total_calories'] / 10;
                    $fatData[] = $row['total_fat'];
                    $proteinData[] = $row['total_protein'];
                    $carbohydrateData[] = $row['total_carbohydrate'];
                }
                ?>
                <script>
                    document.addEventListener("DOMContentLoaded", function() {
                        var ctx = document.getElementById('nutritionPopularityChart').getContext('2d');

                        new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: <?php echo json_encode($nutritionLabels); ?>,
                                datasets: [{
                                        label: 'Calories',
                                        data: <?php echo json_encode($caloriesData); ?>,
                                        backgroundColor: 'rgb(255, 142, 166)'
                                    },
                                    {
                                        label: 'Fat',
                                        data: <?php echo json_encode($fatData); ?>,
                                        backgroundColor: 'rgb(255, 206, 146)'
                                    },
                                    {
                                        label: 'Protein',
                                        data: <?php echo json_encode($proteinData); ?>,
                                        backgroundColor: 'rgb(175, 255, 208)'
                                    },
                                    {
                                        label: 'Carbohydrate',
                                        data: <?php echo json_encode($carbohydrateData); ?>,
                                        backgroundColor: 'rgb(175, 222, 255)'
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                scales: {
                                    x: {
                                        stacked: true
                                    },
                                    y: {
                                        stacked: true,
                                        title: {
                                            display: true,
                                            text: 'Nutritional Values'
                                        }
                                    },
                                }
                            }
                        });
                    });
                </script>
                <!-- ----------------------------------CHART 2-------------------------- -->
                <?php
                $sqlNutritionPerformance = "
                    SELECT CONCAT(YEAR(n.date_registered), '-', LPAD(((MONTH(n.date_registered)-1) DIV 4)*4 + 1, 2, '0')) AS period,
                        SUM(n.calories) AS total_calories,
                        SUM(n.fat) AS total_fat,
                        SUM(n.protein) AS total_protein,
                        SUM(n.carbohydrate) AS total_carbohydrate,
                        COUNT(dh.diet_id) AS member_performance
                    FROM nutrition n
                    JOIN diet_nutrition dn ON n.nutrition_id = dn.nutrition_id
                    JOIN diet_history dh ON dn.diet_id = dh.diet_id
                    GROUP BY period
                    ORDER BY period ASC";

                $resultNutritionPerformance = $dbConn->query($sqlNutritionPerformance);

                $nutritionLabels = [];
                $caloriesData = [];
                $fatData = [];
                $proteinData = [];
                $carbohydrateData = [];
                $memberPerformanceData = [];

                $cumulativeCalories = 0;
                $cumulativeFat = 0;
                $cumulativeProtein = 0;
                $cumulativeCarbohydrate = 0;
                $cumulativeMemberPerformance = 0;

                while ($row = $resultNutritionPerformance->fetch_assoc()) {
                    $nutritionLabels[] = $row['period'];

                    // Cumulative Sum Calculation
                    $cumulativeCalories += $row['total_calories'] / 10;
                    $cumulativeFat += $row['total_fat'];
                    $cumulativeProtein += $row['total_protein'];
                    $cumulativeCarbohydrate += $row['total_carbohydrate'];
                    $cumulativeMemberPerformance += $row['member_performance'];

                    $caloriesData[] = $cumulativeCalories;
                    $fatData[] = $cumulativeFat;
                    $proteinData[] = $cumulativeProtein;
                    $carbohydrateData[] = $cumulativeCarbohydrate;
                    $memberPerformanceData[] = $cumulativeMemberPerformance;
                }
                ?>

                <script>
                    document.addEventListener("DOMContentLoaded", function() {
                        var ctx = document.getElementById('nutritionPerformanceChart').getContext('2d');
                        var labels = <?php echo json_encode($nutritionLabels); ?>;
                        var calories = <?php echo json_encode($caloriesData); ?>;
                        var fat = <?php echo json_encode($fatData); ?>;
                        var protein = <?php echo json_encode($proteinData); ?>;
                        var carbohydrate = <?php echo json_encode($carbohydrateData); ?>;
                        var performance = <?php echo json_encode($memberPerformanceData); ?>;

                        new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: <?php echo json_encode($nutritionLabels); ?>,
                                datasets: [{
                                        label: 'Member Performance (Cumulative)',
                                        data: <?php echo json_encode($memberPerformanceData); ?>,
                                        borderColor: 'rgb(235, 61, 61)',
                                        backgroundColor: 'rgb(235, 61, 61)',
                                        type: 'line',
                                        fill: false,
                                        yAxisID: 'y1'
                                    },
                                    {
                                        label: 'Calories (Cumulative)',
                                        data: <?php echo json_encode($caloriesData); ?>,
                                        backgroundColor: 'rgb(255, 142, 166)',
                                        yAxisID: 'y'
                                    },
                                    {
                                        label: 'Fat (Cumulative)',
                                        data: <?php echo json_encode($fatData); ?>,
                                        backgroundColor: 'rgb(255, 206, 146)',
                                        yAxisID: 'y'
                                    },
                                    {
                                        label: 'Protein (Cumulative)',
                                        data: <?php echo json_encode($proteinData); ?>,
                                        backgroundColor: 'rgb(175, 255, 208)',
                                        yAxisID: 'y'
                                    },
                                    {
                                        label: 'Carbohydrate (Cumulative)',
                                        data: <?php echo json_encode($carbohydrateData); ?>,
                                        backgroundColor: 'rgb(175, 222, 255)',
                                        yAxisID: 'y'
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                scales: {
                                    x: {
                                        title: {
                                            display: true,
                                            text: 'Date Range (Cumulative per 4 Months)'
                                        }
                                    },
                                    y: {
                                        beginAtZero: true,
                                        stacked: false,
                                        title: {
                                            display: true,
                                            text: 'Cumulative Nutritional Values'
                                        }
                                    },
                                    y1: {
                                        beginAtZero: true,
                                        position: 'right',
                                        title: {
                                            display: true,
                                            text: 'Cumulative Member Performance'
                                        },
                                        grid: {
                                            drawOnChartArea: false
                                        }
                                    }
                                },
                                plugins: {
                                    legend: {
                                        position: 'top'
                                    },
                                    title: {
                                        display: true,
                                        text: 'Cumulative Nutrition vs Member Performance'
                                    }
                                }
                            }
                        });
                    });
                </script>
            </div>
        </section>

        <!-- Function to show the selected description and hide others -->
        <script>
            document.addEventListener("DOMContentLoaded", function() {
                // Function to show the selected description and hide others
                function showDescription(descriptionId) {
                    // Hide all descriptions with the fade-out-down animation
                    document.querySelectorAll('.chart-description').forEach(desc => {
                        desc.classList.remove('fade-in-up');
                        desc.classList.add('fade-out-down');
                    });

                    // Show the selected description with the fade-in-up animation
                    let descriptionDiv = document.getElementById(descriptionId);
                    if (descriptionDiv) {
                        descriptionDiv.classList.remove('fade-out-down');
                        descriptionDiv.classList.add('fade-in-up');
                    }
                }

                // Add event listener to the parent container (event delegation) for chart clicks
                document.addEventListener('click', function(event) {
                    let clickedChart = event.target.closest('.chart'); // Get closest chart element clicked

                    // If a chart is clicked
                    if (clickedChart) {
                        let descriptionId = clickedChart.getAttribute('data-description');
                        if (descriptionId) {
                            showDescription(descriptionId);
                        }
                    } else {
                        // If the click is outside the chart or description, hide all descriptions
                        document.querySelectorAll('.chart-description').forEach(desc => {
                            desc.classList.remove('fade-in-up');
                            desc.classList.add('fade-out-down');
                        });
                    }
                });
            });
        </script>

</body>

</html>