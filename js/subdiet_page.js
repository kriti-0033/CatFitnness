document.addEventListener("DOMContentLoaded", function() {
    const checklistItems = document.querySelectorAll('#checklist input[type="checkbox"]');
    checklistItems.forEach(item => {
        item.checked = false; // Uncheck all items
    });
});

function goBack() {
    window.history.back(); 
}