class Gauge {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.yaw = 0;
        this.pitch = 0;
        
        // 默认配置
        this.config = {
            minAngle: -360,    // 最小偏航角
            maxAngle: 360,     // 最大偏航角
            minPitch: -90,     // 最小俯仰角
            maxPitch: 90,      // 最大俯仰角
            skyColor: '#87CEEB',  // 天空颜色
            groundColor: '#8B4513', // 地面颜色
            scaleColor: '#fff',    // 刻度颜色
            pitchLines: 6,         // 俯仰刻度线数量
            lineSpacing: 10,       // 刻度线间距
            ...options
        };
    }

    // 设置偏航角
    setYaw(angle) {
        this.yaw = Math.max(this.config.minAngle, Math.min(this.config.maxAngle, angle));
    }

    // 设置俯仰角
    setPitch(angle) {
        this.pitch = Math.max(this.config.minPitch, Math.min(this.config.maxPitch, angle));
    }

    // 绘制仪表盘
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        // 绘制外圆
        this.drawOuterCircle(centerX, centerY, radius);
        
        // 绘制动态部分
        this.drawDynamicHorizon(centerX, centerY, radius);
        
        // 绘制固定刻度
        this.drawFixedIndicators(centerX, centerY, radius);
        
        // 绘制固定标记
        this.drawFixedMarkers(centerX, centerY);
    }

    // 绘制外圆
    drawOuterCircle(centerX, centerY, radius) {
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.config.scaleColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    // 绘制动态地平线
    drawDynamicHorizon(centerX, centerY, radius) {
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        const normalizedYaw = ((this.yaw % 360) + 360) % 360;
        this.ctx.rotate(-normalizedYaw * Math.PI / 180);
        
        const pitchScale = radius / 90;
        const pitchOffset = this.pitch * pitchScale;
        
        const gradient = this.ctx.createLinearGradient(
            0, -radius + pitchOffset, 
            0, radius + pitchOffset
        );
        gradient.addColorStop(0, this.config.skyColor);
        gradient.addColorStop(0.5, this.config.skyColor);
        gradient.addColorStop(0.5, this.config.groundColor);
        gradient.addColorStop(1, this.config.groundColor);
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-radius, pitchOffset);
        this.ctx.lineTo(radius, pitchOffset);
        this.ctx.strokeStyle = this.config.scaleColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    // 绘制固定指示器
    drawFixedIndicators(centerX, centerY, radius) {
        this.drawHeadingIndicators(centerX, centerY, radius);
        this.drawPitchIndicators(centerX, centerY, radius);
    }

    // 绘制俯仰刻度
    drawPitchIndicators(centerX, centerY, radius) {
        const lineLength = 20;
        
        this.ctx.save();
        this.ctx.strokeStyle = this.config.scaleColor;
        this.ctx.lineWidth = 1;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = this.config.scaleColor;
        this.ctx.textAlign = 'center';
        
        for (let i = 1; i <= this.config.pitchLines; i++) {
            // 上方刻度
            const yPosUp = centerY - i * this.config.lineSpacing;
            this.drawPitchLine(centerX, yPosUp, lineLength, i);
            
            // 下方刻度
            const yPosDown = centerY + i * this.config.lineSpacing;
            this.drawPitchLine(centerX, yPosDown, lineLength, i);
        }
        
        this.ctx.restore();
    }

    drawPitchLine(centerX, yPos, lineLength, i) {
        this.ctx.beginPath();
        if(i % 2) {
            this.ctx.moveTo(centerX - lineLength/2 + 5, yPos);
            this.ctx.lineTo(centerX + lineLength/2 - 5, yPos);
        } else {
            this.ctx.moveTo(centerX - lineLength, yPos);
            this.ctx.lineTo(centerX + lineLength, yPos);
            this.ctx.fillText((i * 10).toString(), centerX + lineLength + 15, yPos + 4);
            this.ctx.fillText((i * 10).toString(), centerX - lineLength - 15, yPos + 4);
        }
        this.ctx.stroke();
    }

    // 绘制航向指示器
    drawHeadingIndicators(centerX, centerY, radius) {
        const indicatorSize = 15;
        const textOffset = 25;
        
        this.ctx.save();
        this.ctx.strokeStyle = this.config.scaleColor;
        this.ctx.lineWidth = 1;
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = this.config.scaleColor;
        this.ctx.textAlign = 'center';
        
        const headings = [
            { angle: 0, label: 'N' },
            { angle: 90, label: 'E' },
            { angle: 180, label: 'S' },
            { angle: 270, label: 'W' }
        ];
        
        headings.forEach(heading => {
            const angle = heading.angle * Math.PI / 180;
            const x = centerX + Math.sin(angle) * (radius + textOffset/2);
            const y = centerY - Math.cos(angle) * (radius + textOffset/2);
            
            this.ctx.beginPath();
            this.ctx.moveTo(
                centerX + Math.sin(angle) * (radius - indicatorSize),
                centerY - Math.cos(angle) * (radius - indicatorSize)
            );
            this.ctx.lineTo(
                centerX + Math.sin(angle) * radius,
                centerY - Math.cos(angle) * radius
            );
            this.ctx.stroke();
            this.ctx.fillText(heading.label, x, y + 5);
        });
        
        for (let i = 0; i < 360; i += 30) {
            if (i % 90 === 0) continue;
            const angle = i * Math.PI / 180;
            const lineLength = 10;
            
            this.ctx.beginPath();
            const x = centerX + Math.sin(angle) * (radius + lineLength);
            const y = centerY - Math.cos(angle) * (radius + lineLength);
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(
                centerX + Math.sin(angle) * radius,
                centerY - Math.cos(angle) * radius
            );
            this.ctx.stroke();
            this.ctx.fillText((i/10).toString(), x, y+5);
        }
        
        this.ctx.restore();
    }

    // 绘制固定标记
    drawFixedMarkers(centerX, centerY) {
        const radius = Math.min(centerX, centerY) - 20;
        const pitchScale = radius / 90;
        const pitchOffset = 1 * pitchScale;
        
        this.ctx.save();
        this.ctx.strokeStyle = '#f00';
        this.ctx.lineWidth = 2;
        
        // 水平线
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 50, centerY + pitchOffset);
        this.ctx.lineTo(centerX - 10, centerY + pitchOffset);
        this.ctx.moveTo(centerX + 10, centerY + pitchOffset);
        this.ctx.lineTo(centerX + 50, centerY + pitchOffset);
        this.ctx.stroke();
        
        // 垂直线
        this.ctx.beginPath();
        this.ctx.lineWidth = 5;
        this.ctx.moveTo(centerX, centerY + 2 + pitchOffset);
        this.ctx.lineTo(centerX, centerY - 2 + pitchOffset);
        this.ctx.strokeStyle = '#ff0';
        this.ctx.stroke();
        this.ctx.restore();
    }
}
