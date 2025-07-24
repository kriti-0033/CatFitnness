document.addEventListener('DOMContentLoaded', function() {
    const textElement = document.getElementById('type'); 
    const cursorElement = document.querySelector('.cursor'); 
    const originalHTML = textElement.innerHTML; 
    textElement.innerHTML = ''; 
    let index = 0;

    const type = () => {
        if (index < originalHTML.length) {
            textElement.innerHTML = originalHTML.slice(0, index + 1);
            index++;
            setTimeout(type, 60); 
        } else {
            cursorElement.style.display = 'none'; 
        }
    };

    type();
    
    //count up numbers
    const countUpElements = document.querySelectorAll('.count-up');
    const countUpPercentage = document.querySelectorAll('.count-up-p');

    countUpElements.forEach(element => {
        const target = parseInt(element.innerText, 10);
        let count = 0;
        const duration = 5000; 
        const increment = target / (duration / 16); 

        const updateCount = () => {
            if (count < target) {
                count += increment;
                element.innerText = Math.round(count);
                requestAnimationFrame(updateCount);
            } else {
                element.innerText = target;
            }
        };
        updateCount();
    });

    countUpPercentage.forEach(element => {
        const target = parseFloat(element.innerText); 
        let count = 0; 
        const duration = 5700; 
        const increment = target / (duration / 16);

        const updateCount = () => {
            if (count < target) {
                count += increment;
                element.innerText = `${formatToTwoDecimals(count)}%`;
                requestAnimationFrame(updateCount);
            } else {
                element.innerText = `${formatToTwoDecimals(target)}%`; // Ensure final value is exact
            }
        };

        updateCount();
    });

    function formatToTwoDecimals(num) {
        return Math.round(num * 100) / 100; 
    }
});