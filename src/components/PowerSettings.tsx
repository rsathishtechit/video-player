import React, { useState, useEffect } from "react";

interface PowerInfo {
  isOnBattery: boolean;
  systemIdleTime: number;
  thermalState: string;
}

const PowerSettings: React.FC = () => {
  const [powerInfo, setPowerInfo] = useState<PowerInfo | null>(null);
  const [powerSaveMode, setPowerSaveMode] = useState(false);

  useEffect(() => {
    loadPowerInfo();

    // Check power status every 10 seconds
    const interval = setInterval(loadPowerInfo, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadPowerInfo = async () => {
    try {
      const info = await window.electronAPI.getPowerInfo();
      setPowerInfo(info);

      // Auto-enable power save mode when on battery
      if (info.isOnBattery && !powerSaveMode) {
        setPowerSaveMode(true);
      }
    } catch (error) {
      console.error("Error loading power info:", error);
    }
  };

  const getBatteryIcon = () => {
    if (!powerInfo) return "🔋";
    return powerInfo.isOnBattery ? "🔋" : "🔌";
  };

  const getPowerStatus = () => {
    if (!powerInfo) return "Unknown";
    return powerInfo.isOnBattery ? "On Battery" : "Plugged In";
  };

  const getThermalStatus = () => {
    if (!powerInfo) return "Normal";
    return powerInfo.thermalState === "critical" ? "Hot" : "Normal";
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <h2 className="text-xl font-semibold text-white mb-6">
        Power Management
      </h2>

      {/* Power Status */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getBatteryIcon()}</span>
            <div>
              <div className="text-white font-medium">Power Status</div>
              <div className="text-gray-400 text-sm">{getPowerStatus()}</div>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              powerInfo?.isOnBattery
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-green-500/20 text-green-400"
            }`}
          >
            {powerInfo?.isOnBattery ? "Battery" : "AC Power"}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🌡️</span>
            <div>
              <div className="text-white font-medium">System Temperature</div>
              <div className="text-gray-400 text-sm">{getThermalStatus()}</div>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              powerInfo?.thermalState === "critical"
                ? "bg-red-500/20 text-red-400"
                : "bg-green-500/20 text-green-400"
            }`}
          >
            {getThermalStatus()}
          </div>
        </div>
      </div>

      {/* Power Save Mode Toggle */}
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">⚡</span>
          <div>
            <div className="text-white font-medium">Power Save Mode</div>
            <div className="text-gray-400 text-sm">
              Reduces background activity and update frequency
            </div>
          </div>
        </div>
        <button
          onClick={() => setPowerSaveMode(!powerSaveMode)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            powerSaveMode ? "bg-blue-600" : "bg-gray-600"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              powerSaveMode ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Power Save Features */}
      {powerSaveMode && (
        <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
          <h3 className="text-blue-400 font-medium mb-2">
            Active Power Optimizations:
          </h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Reduced video player update frequency</li>
            <li>• Throttled database saves</li>
            <li>• Limited background refreshes</li>
            <li>• Optimized UI rendering</li>
            {powerInfo?.isOnBattery && (
              <li>• Battery-aware performance mode</li>
            )}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {powerInfo?.isOnBattery && (
        <div className="mt-4 bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4">
          <h3 className="text-yellow-400 font-medium mb-2">💡 Battery Tips:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Lower screen brightness</li>
            <li>• Close unused applications</li>
            <li>• Use fullscreen mode for better efficiency</li>
            <li>• Pause videos when not actively watching</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PowerSettings;

