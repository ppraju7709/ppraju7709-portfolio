// Test button functionality
function testButton() {
    alert('🎉 Your portfolio works perfectly!\n\nNext: Add real projects to projects/ folder!');
    console.log('Portfolio loaded successfully!');
}

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});
