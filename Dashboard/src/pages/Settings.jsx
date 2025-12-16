import { useState, useEffect } from "react";
import { useMqtt } from "../context/MqttContext";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { settings, updateSettings, connect, DEFAULT_SETTINGS } = useMqtt();
  const { user, updateProfile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? "broker" : "profile");

  // Effect to ensure correct tab if role changes or on load
  useEffect(() => {
    if (!isAdmin && activeTab !== "profile") {
      setActiveTab("profile");
    }
  }, [isAdmin]);

  // Profile Settings
  const [profileData, setProfileData] = useState({
    currentPassword: "",
    newUsername: user?.username || "",
    newPassword: "",
    confirmPassword: ""
  });

  // Broker Settings
  const [brokerData, setBrokerData] = useState({
    host: settings.host,
    port: settings.port,
    updateInterval: settings.updateInterval,
  });

  // Threshold Settings
  const [thresholdData, setThresholdData] = useState({
    thresholds: settings.thresholds || DEFAULT_SETTINGS.thresholds,
  });

  const [saved, setSaved] = useState(false);
  const [savedType, setSavedType] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleBrokerChange = (e) => {
    const { name, value } = e.target;
    setBrokerData((prev) => ({
      ...prev,
      [name]:
        name === "port" || name === "updateInterval"
          ? value === "" ? "" : parseInt(value) || ""
          : value,
    }));
  };

  const handleThresholdChange = (sensor, field, value) => {
    setThresholdData((prev) => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [sensor]: {
          ...prev.thresholds[sensor],
          [field]: value === "" ? "" : parseFloat(value),
        },
      },
    }));
  };

  const [showBrokerModal, setShowBrokerModal] = useState(false);

  const handleBrokerSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    // Validate required fields
    if (!brokerData.host || brokerData.host.trim() === "") {
      setValidationError("MQTT Host harus diisi");
      return;
    }
    if (brokerData.port === "" || brokerData.port === null) {
      setValidationError("MQTT Port harus diisi");
      return;
    }
    if (brokerData.updateInterval === "" || brokerData.updateInterval === null) {
      setValidationError("Update Interval harus diisi");
      return;
    }

    // Show Confirmation Modal instead of saving immediately
    setShowBrokerModal(true);
  };

  const confirmBrokerSave = () => {
    const newSettings = {
      ...settings,
      host: brokerData.host,
      port: Number(brokerData.port),
      updateInterval: Number(brokerData.updateInterval),
      thresholds: settings.thresholds || DEFAULT_SETTINGS.thresholds,
    };
    updateSettings(newSettings);
    setShowBrokerModal(false);
    setSavedType("broker");
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      connect();
    }, 1500);
  };

  const handleThresholdSubmit = (e) => {
    e.preventDefault();
    const newSettings = {
      ...settings,
      thresholds: thresholdData.thresholds,
    };
    updateSettings(newSettings);
    setSavedType("threshold");
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 1500);
  };

  const handleBrokerReset = () => {
    setBrokerData({
      host: DEFAULT_SETTINGS.host,
      port: DEFAULT_SETTINGS.port,
      updateInterval: DEFAULT_SETTINGS.updateInterval,
    });
  };

  const handleThresholdReset = () => {
    setThresholdData({
      thresholds: DEFAULT_SETTINGS.thresholds,
    });
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!profileData.currentPassword) {
      setValidationError("Password saat ini diperlukan");
      return;
    }

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setValidationError("Password baru tidak cocok");
      return;
    }

    const res = await updateProfile(
      profileData.currentPassword,
      profileData.newUsername !== user.username ? profileData.newUsername : null,
      profileData.newPassword || null
    );

    if (res.success) {
      setSavedType("profile");
      setSaved(true);
      setProfileData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      setTimeout(() => setSaved(false), 2000);
    } else {
      setValidationError(res.error);
    }
  };

  return (
    <div className="page-section">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Pengaturan Sistem</h2>
        <p className="text-slate-600 mt-1">
          Konfigurasi koneksi dan parameter sistem
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto">
        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab("broker")}
              className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === "broker"
                ? "border-teal-600 text-teal-600"
                : "border-transparent text-slate-600 hover:text-slate-800"
                }`}
            >
              <svg
                className="inline-block w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
              Pengaturan Broker
            </button>
            <button
              onClick={() => setActiveTab("threshold")}
              className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === "threshold"
                ? "border-teal-600 text-teal-600"
                : "border-transparent text-slate-600 hover:text-slate-800"
                }`}
            >
              <svg
                className="inline-block w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Pengaturan Threshold
            </button>
          </>
        )}
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === "profile"
            ? "border-teal-600 text-teal-600"
            : "border-transparent text-slate-600 hover:text-slate-800"
            }`}
        >
          <svg
            className="inline-block w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Profil User
        </button>
      </div>

      {/* Broker Settings Tab */}
      {activeTab === "broker" && (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
          <form className="space-y-6" onSubmit={handleBrokerSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  MQTT Host
                  <span className="text-red-500">*</span>
                </label>
                <input
                  name="host"
                  type="text"
                  value={brokerData.host}
                  onChange={handleBrokerChange}
                  placeholder="contoh: broker.hivemq.com"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Alamat host MQTT broker
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  MQTT Port
                  <span className="text-red-500">*</span>
                </label>
                <input
                  name="port"
                  type="number"
                  value={brokerData.port}
                  onChange={handleBrokerChange}
                  placeholder="contoh: 8000"
                  min="1"
                  max="65535"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Port MQTT broker (default: 8884 untuk WSS)
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Update Interval (detik)
                <span className="text-red-500">*</span>
              </label>
              <input
                name="updateInterval"
                type="number"
                value={brokerData.updateInterval}
                onChange={handleBrokerChange}
                min="1"
                max="3600"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />
              <p className="mt-1 text-xs text-slate-500">
                Interval update data dalam detik (1-3600)
              </p>
            </div>

            {validationError && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                {validationError}
              </div>
            )}

            {saved && savedType === "broker" && (
              <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                Pengaturan broker berhasil disimpan! Menghubungkan ulang ke broker...
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleBrokerReset}
                className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                Simpan Broker
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Threshold Settings Tab */}
      {activeTab === "threshold" && (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
          <form className="space-y-6" onSubmit={handleThresholdSubmit}>
            {/* Threshold Settings */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Pengaturan Threshold Sensor
              </h3>

              {/* DHT22 Threshold */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">
                  DHT22 (Suhu & Kelembaban)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Suhu Max (°C)
                    </label>
                    <input
                      type="number"
                      value={thresholdData.thresholds.dht22.tempMax}
                      onChange={(e) =>
                        handleThresholdChange(
                          "dht22",
                          "tempMax",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Suhu Min (°C)
                    </label>
                    <input
                      type="number"
                      value={thresholdData.thresholds.dht22.tempMin}
                      onChange={(e) =>
                        handleThresholdChange(
                          "dht22",
                          "tempMin",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Kelembaban Max (%)
                    </label>
                    <input
                      type="number"
                      value={thresholdData.thresholds.dht22.humMax}
                      onChange={(e) =>
                        handleThresholdChange("dht22", "humMax", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Kelembaban Min (%)
                    </label>
                    <input
                      type="number"
                      value={thresholdData.thresholds.dht22.humMin}
                      onChange={(e) =>
                        handleThresholdChange("dht22", "humMin", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* MQ2 Threshold */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">
                  MQ2 (Kualitas Udara)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Smoke Waspada
                    </label>
                    <input
                      type="number"
                      value={thresholdData.thresholds.mq2.smokeWarn}
                      onChange={(e) =>
                        handleThresholdChange(
                          "mq2",
                          "smokeWarn",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Smoke Bahaya
                    </label>
                    <input
                      type="number"
                      value={thresholdData.thresholds.mq2.smokeMax}
                      onChange={(e) =>
                        handleThresholdChange("mq2", "smokeMax", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* PZEM004T Threshold */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">
                  PZEM004T (Daya & Tegangan)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Daya Max (W)
                    </label>
                    <input
                      type="number"
                      value={thresholdData.thresholds.pzem004t.powerMax}
                      onChange={(e) =>
                        handleThresholdChange(
                          "pzem004t",
                          "powerMax",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Tegangan Min (V)
                    </label>
                    <input
                      type="number"
                      value={thresholdData.thresholds.pzem004t.voltageMin}
                      onChange={(e) =>
                        handleThresholdChange(
                          "pzem004t",
                          "voltageMin",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Tegangan Max (V)
                    </label>
                    <input
                      type="number"
                      value={thresholdData.thresholds.pzem004t.voltageMax}
                      onChange={(e) =>
                        handleThresholdChange(
                          "pzem004t",
                          "voltageMax",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* BH1750 Threshold */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">
                  BH1750 (Cahaya)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Cahaya Max (lux)
                    </label>
                    <input
                      type="number"
                      value={thresholdData.thresholds.bh1750.luxMax}
                      onChange={(e) =>
                        handleThresholdChange(
                          "bh1750",
                          "luxMax",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {saved && savedType === "threshold" && (
              <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                Pengaturan threshold berhasil disimpan!
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleThresholdReset}
                className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                Simpan Threshold
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Settings Tab */}
      {activeTab === "profile" && (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
          <form className="space-y-6" onSubmit={handleProfileSubmit}>
            <div className="md:w-2/3">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Username Baru
              </label>
              <input
                name="newUsername"
                type="text"
                value={profileData.newUsername}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                placeholder="Masukkan username baru"
              />
            </div>

            <div className="md:w-2/3">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password Baru (Opsional)
              </label>
              <input
                name="newPassword"
                type="password"
                value={profileData.newPassword}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                placeholder="Kosongkan jika tidak ingin mengubah password"
              />
            </div>

            <div className="md:w-2/3">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Konfirmasi Password Baru
              </label>
              <input
                name="confirmPassword"
                type="password"
                value={profileData.confirmPassword}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                placeholder="Ulangi password baru"
              />
            </div>

            <hr className="border-slate-200 my-6" />

            <div className="md:w-2/3">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password Saat Ini <span className="text-red-500">*</span>
              </label>
              <input
                name="currentPassword"
                type="password"
                value={profileData.currentPassword}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                placeholder="Masukkan password saat ini untuk konfirmasi"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Diperlukan untuk menyimpan perubahan profil
              </p>
            </div>

            {validationError && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                {validationError}
              </div>
            )}

            {saved && savedType === "profile" && (
              <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                Profil berhasil diperbarui!
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                Simpan Profil
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Broker Confirmation Modal */}
      {showBrokerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Simpan Konfigurasi Broker?</h3>
              <p className="text-slate-600 mb-6 font-medium">
                Perubahan ini akan <span className="text-red-500 font-bold">memutus koneksi saat ini</span> dan menghubungkan ulang ke broker baru. Sensor mungkin tidak update selama proses ini.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowBrokerModal(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmBrokerSave}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-teal-500/30"
                >
                  Ya, Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
