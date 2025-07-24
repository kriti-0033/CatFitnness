<?php
include "conn.php";

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $table = $_POST['table'];
    $id = $_POST['id'];
    $validTables = [
        "member" => "member_id",
        "administrator" => "admin_id",
        "nutrition" => "nutrition_id",
        "diet" => "diet_id",
        "workout" => "workout_id"
    ];

    if ($table == "diet") {
        $sql = "SELECT picture FROM diet WHERE diet_id = ?";
        $stmt = $dbConn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $imageFileName = $row['picture'];

            // Delete the image file if it exists
            if (!empty($imageFileName)) {
                $imagePath = "./uploads/diet/" . $imageFileName;
                if (file_exists($imagePath)) {
                    if (!unlink($imagePath)) {
                        echo "Error: Failed to delete the image file.";
                    }
                }
            }
        }
        $stmt->close();

        $sql = "DELETE FROM diet_nutrition WHERE diet_id = ?";
        $stmt = $dbConn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->close();

        $sql = "DELETE FROM diet_history WHERE diet_id = ?";
        $stmt = $dbConn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->close();

    } else if ($table == "member"){
        $sql = "DELETE FROM member_performance WHERE member_id = ?";
        $stmt = $dbConn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->close();

        $sql = "DELETE FROM diet_history WHERE member_id = ?";
        $stmt = $dbConn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->close();

        $sql = "DELETE FROM custom_diet WHERE member_id = ?";
        $stmt = $dbConn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->close();

        $sql = "DELETE FROM workout_history WHERE member_id = ?";
        $stmt = $dbConn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->close();

    } else if ($table == "workout"){
        $sql = "DELETE FROM workout_history WHERE workout_id = ?";
        $stmt = $dbConn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->close();
        $sql = "SELECT image FROM workout WHERE workout_id = ?";
        $stmt = $dbConn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $imageFileName = $row['image'];

            // Delete the image file if it exists
            if (!empty($imageFileName)) {
                $imagePath = "./assets/workout_pics/" . $imageFileName;
                if (file_exists($imagePath)) {
                    if (!unlink($imagePath)) {
                        echo "Error: Failed to delete the image file.";
                    }
                }
            }
        }
        $stmt->close();
    }

    $sql = "DELETE FROM $table WHERE {$validTables[$table]} = ?";
    $stmt = $dbConn->prepare($sql);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo "Record deleted successfully!";
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
}
?>