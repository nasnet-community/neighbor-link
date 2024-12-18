document.addEventListener('DOMContentLoaded', function() {
    const wiredBtn = document.getElementById('wired-btn');
    const wirelessBtn = document.getElementById('wireless-btn');

    // Check if WAN2 device exists
    ubus.call('network.interface', 'dump', {})
        .then(response => {
            const interfaces = response.interface;
            const hasWan2 = interfaces.some(iface => iface.device === 'wan2');
            
            // Enable wired button only if WAN2 device exists
            wiredBtn.disabled = !hasWan2;
        })
        .catch(error => {
            console.error('Error checking network interfaces:', error);
            wiredBtn.disabled = true;
        });

    // Add click handlers
    wiredBtn.addEventListener('click', () => {
        window.location.href = 'wan2.html';
    });

    wirelessBtn.addEventListener('click', () => {
        window.location.href = 'wifi.html';
    });
}); 