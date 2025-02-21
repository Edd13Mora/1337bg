#!/bin/bash

echo "🚀 Starting Attack Box Installation..."
echo "====================================="
sleep 2

### 🧹 FULL CLEANUP ###
echo "🧹 Removing old containers and images..."
docker stop kali-attack-box >/dev/null 2>&1
docker rm kali-attack-box >/dev/null 2>&1
docker rmi attack-box >/dev/null 2>&1
docker system prune -af >/dev/null 2>&1

### 🏗 BUILD DOCKER IMAGE ###
echo "🐳 Building new Attack Box image..."
cat <<EOF > Dockerfile
FROM kalilinux/kali-rolling

# Fix console-setup issue (prevent interactive prompts)
ENV DEBIAN_FRONTEND=noninteractive
RUN echo '* libraries/restart-without-asking boolean true' | debconf-set-selections

# Install XFCE, NoVNC, and pentesting tools
RUN apt update && apt install -y \
    xfce4 xfce4-goodies \
    x11vnc xvfb novnc websockify \
    dbus-x11 \
    kali-linux-headless \
    burpsuite wireshark metasploit-framework firefox-esr \
    && apt clean

# Set up VNC password
RUN mkdir -p /root/.vnc && echo kali | x11vnc -storepasswd kali /root/.vnc/passwd && chmod 600 /root/.vnc/passwd

# Clone NoVNC
WORKDIR /root
RUN git clone https://github.com/novnc/noVNC.git && cd /root/noVNC && git checkout v1.2.0 && ln -s /root/noVNC/vnc.html /root/noVNC/index.html

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
EOF

### 📜 CREATE START SCRIPT ###
cat <<EOF > start.sh
#!/bin/bash

echo "🚀 Starting XFCE & VNC Server..."

# Start Xvfb (Virtual Framebuffer)
Xvfb :1 -screen 0 1920x1080x24 &

# Start XFCE
export DISPLAY=:1
dbus-launch --exit-with-session startxfce4 &

# Fix XFCE Background & Window Freezing
sleep 2
xfwm4 --replace --compositor=on &
xfdesktop --reload &

# Ensure dbus is running properly
service dbus start

# Start VNC Server
x11vnc -display :1 -usepw -forever -listen 0.0.0.0 -rfbport 5901 &

# Start NoVNC Web Interface
/root/noVNC/utils/launch.sh --vnc 0.0.0.0:5901 --listen 0.0.0.0:8080
EOF

### 🛠 BUILD DOCKER IMAGE ###
docker build -t attack-box .

### 🚀 RUN ATTACK BOX CONTAINER ###
echo "🚀 Running Attack Box..."
docker run -d --name kali-attack-box -p 8080:8080 -p 5901:5901 attack-box

### 🔥 FINAL FIXES INSIDE CONTAINER ###
echo "🔧 Applying final fixes inside container..."
sleep 3
docker exec -it kali-attack-box dbus-launch --exit-with-session startxfce4 &
docker exec -it kali-attack-box xfwm4 --replace --compositor=on &
docker exec -it kali-attack-box xfdesktop --reload &
docker exec -it kali-attack-box rm -rf ~/.config/xfce4/
docker exec -it kali-attack-box mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix
docker exec -it kali-attack-box service dbus start

### ✅ INSTALLATION COMPLETE ###
echo "✅ Installation Complete!"
echo "🌍 Access your Attack Box at: http://$(curl -s ifconfig.me):8080"
echo "🔑 Default VNC Password: kali"
