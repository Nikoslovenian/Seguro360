"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Shield,
  Save,
  AlertTriangle,
  Trash2,
  Bell,
  FileText,
  BarChart3,
  Camera,
  Users,
  Plus,
  X,
  Download,
  Heart,
  Baby,
  MapPin,
  Globe,
  Calendar,
} from "lucide-react";
import { REGIONES, getComunas } from "@/lib/chile-geo";

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  rut: string;
  age: number;
  gender: string;
  civilStatus: string;
  country: string;
  region: string;
  comuna: string;
}

interface FamilyChild {
  id: string;
  gender: string;
  age: number;
}

interface FamilyPet {
  id: string;
  type: string;
  name: string;
  age: number;
}

const petTypeOptions = ["Perro", "Gato", "Ave", "Reptil"];

interface ConsentItem {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const genderOptions = ["Masculino", "Femenino", "Otro", "Prefiero no decir"];

const civilStatusOptions = [
  "Soltero/a",
  "Casado/a",
  "Divorciado/a",
  "Viudo/a",
  "Conviviente civil",
  "Otro",
];

const countryOptions = ["Chile", "Argentina", "Peru", "Colombia", "Otro"];

const regionOptions = REGIONES;

const initialProfile: ProfileData = {
  name: "Carlos Mendez Arriagada",
  email: "carlos.mendez@email.cl",
  phone: "+56 9 8765 4321",
  rut: "12.345.678-9",
  age: 35,
  gender: "Masculino",
  civilStatus: "Casado/a",
  country: "Chile",
  region: "Metropolitana",
  comuna: "Providencia",
};

const initialConsents: ConsentItem[] = [
  {
    id: "notifications",
    label: "Notificaciones por email",
    description:
      "Recibe alertas de vencimiento de polizas, cambios en coberturas y novedades importantes sobre tus seguros.",
    enabled: true,
    icon: Bell,
  },
  {
    id: "ai_analysis",
    label: "Analisis con inteligencia artificial",
    description:
      "Permite que la IA analice tus documentos para extraer coberturas y exclusiones automaticamente.",
    enabled: true,
    icon: BarChart3,
  },
  {
    id: "data_sharing",
    label: "Compartir datos con agente",
    description:
      "Permite que tu agente de seguros acceda a tu informacion de polizas para brindarte mejor asesoria.",
    enabled: false,
    icon: FileText,
  },
  {
    id: "marketing",
    label: "Comunicaciones comerciales",
    description:
      "Recibe ofertas y recomendaciones de productos de seguros basadas en tu perfil y necesidades.",
    enabled: false,
    icon: Shield,
  },
];

/* ------------------------------------------------------------------ */
/*  TOGGLE SWITCH COMPONENT                                            */
/* ------------------------------------------------------------------ */

function ToggleSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        enabled ? "bg-blue-600" : "bg-[#2d3548]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
          enabled ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  SELECT COMPONENT                                                   */
/* ------------------------------------------------------------------ */

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-[#e2e8f0]">
        {Icon && <Icon className="h-4 w-4 text-[#94a3b8]" />}
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors appearance-none"
      >
        {placeholder && (
          <option value="" className="bg-[#0f1117] text-[#64748b]">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#0f1117]">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [consents, setConsents] = useState<ConsentItem[]>(initialConsents);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Family state
  const [hasPartner, setHasPartner] = useState(false);
  const [partnerGender, setPartnerGender] = useState("Femenino");
  const [partnerAge, setPartnerAge] = useState(33);
  const [children, setChildren] = useState<FamilyChild[]>([]);
  const [pets, setPets] = useState<FamilyPet[]>([]);

  // Delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggle = (id: string) => {
    setConsents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const addChild = () => {
    if (children.length >= 10) return;
    setChildren((prev) => [
      ...prev,
      { id: `child-${Date.now()}`, gender: "Masculino", age: 5 },
    ]);
  };

  const removeChild = (id: string) => {
    setChildren((prev) => prev.filter((c) => c.id !== id));
  };

  const updateChild = (id: string, field: "gender" | "age", value: string | number) => {
    setChildren((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const addPet = () => {
    if (pets.length >= 10) return;
    setPets((prev) => [
      ...prev,
      { id: `pet-${Date.now()}`, type: "Perro", name: "", age: 1 },
    ]);
  };

  const removePet = (id: string) => {
    setPets((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePet = (id: string, field: keyof FamilyPet, value: string | number) => {
    setPets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const availableComunas = getComunas(profile.region);
  const totalFamilyMembers =
    1 + (hasPartner ? 1 : 0) + children.length + pets.length;

  const handleRegionChange = (val: string) => {
    setProfile({ ...profile, region: val, comuna: "" });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 -m-6 p-6 min-h-full bg-[#0f1117]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500">
          <User className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">Mi Perfil</h1>
          <p className="text-sm text-[#94a3b8]">
            Administra tu informacion personal y preferencias
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  1. AVATAR + BASIC INFO                                       */}
      {/* ============================================================ */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-2xl font-bold text-white shadow-lg shadow-blue-500/20">
              {profile.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1c2333] bg-[#0f1117] text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[#e2e8f0]">
              {profile.name}
            </h2>
            <p className="text-sm text-[#94a3b8]">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                <Shield className="h-3 w-3" />
                Usuario
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                Verificado
              </span>
            </div>
          </div>

          {/* Edit photo button */}
          <button className="hidden sm:flex items-center gap-2 rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-2.5 text-sm font-medium text-[#94a3b8] transition-all hover:border-[#3d4a63] hover:text-[#e2e8f0]">
            <Camera className="h-4 w-4" />
            Editar foto
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  2. DATOS PERSONALES                                          */}
      {/* ============================================================ */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6">
        <h2 className="text-lg font-semibold text-[#e2e8f0] mb-1">
          Datos Personales
        </h2>
        <p className="text-sm text-[#94a3b8] mb-5">
          Actualiza tu informacion personal. Los campos marcados con * son obligatorios.
        </p>

        <div className="space-y-4">
          {/* Nombre completo */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-[#e2e8f0]">
              <User className="h-4 w-4 text-[#94a3b8]" />
              Nombre completo
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
            />
          </div>

          {/* Email (readonly) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-[#e2e8f0]">
              <Mail className="h-4 w-4 text-[#94a3b8]" />
              Correo electronico
            </label>
            <div className="relative">
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117]/50 px-4 py-3 text-sm text-[#94a3b8] cursor-not-allowed"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#94a3b8]/50">
                No editable
              </span>
            </div>
          </div>

          {/* Telefono */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-[#e2e8f0]">
              <Phone className="h-4 w-4 text-[#94a3b8]" />
              Telefono
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
            />
          </div>

          {/* RUT */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-[#e2e8f0]">
              <CreditCard className="h-4 w-4 text-[#94a3b8]" />
              RUT
            </label>
            <input
              type="text"
              value={profile.rut}
              onChange={(e) => setProfile({ ...profile, rut: e.target.value })}
              placeholder="12.345.678-9"
              className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
            />
          </div>

          {/* Edad + Genero row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-[#e2e8f0]">
                <Calendar className="h-4 w-4 text-[#94a3b8]" />
                Edad
              </label>
              <input
                type="number"
                min={18}
                max={120}
                value={profile.age}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    age: Math.min(120, Math.max(18, Number(e.target.value))),
                  })
                }
                className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
              />
            </div>
            <SelectField
              label="Genero"
              value={profile.gender}
              onChange={(val) => setProfile({ ...profile, gender: val })}
              options={genderOptions}
            />
          </div>

          {/* Estado civil */}
          <SelectField
            label="Estado civil"
            value={profile.civilStatus}
            onChange={(val) => setProfile({ ...profile, civilStatus: val })}
            options={civilStatusOptions}
            icon={Heart}
          />

          {/* Pais */}
          <SelectField
            label="Pais"
            value={profile.country}
            onChange={(val) => setProfile({ ...profile, country: val })}
            options={countryOptions}
            icon={Globe}
          />

          {/* Region */}
          <SelectField
            label="Region"
            value={profile.region}
            onChange={handleRegionChange}
            options={regionOptions}
            placeholder="Selecciona una region"
            icon={MapPin}
          />

          {/* Comuna */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-[#e2e8f0]">
              <MapPin className="h-4 w-4 text-[#94a3b8]" />
              Comuna
            </label>
            {availableComunas.length > 0 ? (
              <select
                value={profile.comuna}
                onChange={(e) =>
                  setProfile({ ...profile, comuna: e.target.value })
                }
                className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117] px-4 py-3 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors appearance-none"
              >
                <option value="" className="bg-[#0f1117] text-[#64748b]">
                  Selecciona una comuna
                </option>
                {availableComunas.map((c) => (
                  <option key={c} value={c} className="bg-[#0f1117]">
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full rounded-xl border border-[#2d3548] bg-[#0f1117]/50 px-4 py-3 text-sm text-[#64748b]">
                {profile.region
                  ? "No hay comunas disponibles para esta region"
                  : "Seleccione region primero"}
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-400 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
            {saveSuccess && (
              <span className="text-sm text-emerald-400 font-medium animate-pulse">
                Cambios guardados correctamente
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  3. GRUPO FAMILIAR                                            */}
      {/* ============================================================ */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-[#e2e8f0] flex items-center gap-2">
            <Users className="h-5 w-5 text-[#94a3b8]" />
            Grupo Familiar
          </h2>
          <span className="inline-flex items-center rounded-full border border-[#2d3548] bg-[#0f1117] px-3 py-1 text-xs font-medium text-[#94a3b8]">
            {totalFamilyMembers} {totalFamilyMembers === 1 ? "miembro" : "miembros"}
          </span>
        </div>
        <p className="text-sm text-[#94a3b8] mb-5">
          Agrega informacion de tu grupo familiar para mejorar las recomendaciones de seguros.
        </p>

        {/* Partner toggle */}
        <div className="rounded-xl border border-[#2d3548] bg-[#0f1117] p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1c2333]">
                <Heart className="h-4 w-4 text-pink-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#e2e8f0]">
                  Tengo conyuge o pareja
                </p>
                <p className="text-xs text-[#94a3b8]">
                  Incluir pareja en el grupo familiar
                </p>
              </div>
            </div>
            <ToggleSwitch
              enabled={hasPartner}
              onToggle={() => setHasPartner(!hasPartner)}
            />
          </div>

          {/* Partner details */}
          {hasPartner && (
            <div className="mt-4 pt-4 border-t border-[#2d3548]/50 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#e2e8f0]">
                  Genero
                </label>
                <select
                  value={partnerGender}
                  onChange={(e) => setPartnerGender(e.target.value)}
                  className="w-full rounded-xl border border-[#2d3548] bg-[#1c2333] px-4 py-3 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors appearance-none"
                >
                  {genderOptions.map((g) => (
                    <option key={g} value={g} className="bg-[#1c2333]">
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#e2e8f0]">
                  Edad
                </label>
                <input
                  type="number"
                  min={18}
                  max={120}
                  value={partnerAge}
                  onChange={(e) =>
                    setPartnerAge(
                      Math.min(120, Math.max(18, Number(e.target.value)))
                    )
                  }
                  className="w-full rounded-xl border border-[#2d3548] bg-[#1c2333] px-4 py-3 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Children */}
        <div className="space-y-3">
          {children.map((child, index) => (
            <div
              key={child.id}
              className="rounded-xl border border-[#2d3548] bg-[#0f1117] p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Baby className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-[#e2e8f0]">
                    Hijo/a {index + 1}
                  </span>
                </div>
                <button
                  onClick={() => removeChild(child.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94a3b8]">
                    Genero
                  </label>
                  <select
                    value={child.gender}
                    onChange={(e) =>
                      updateChild(child.id, "gender", e.target.value)
                    }
                    className="w-full rounded-xl border border-[#2d3548] bg-[#1c2333] px-4 py-2.5 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors appearance-none"
                  >
                    {genderOptions.map((g) => (
                      <option key={g} value={g} className="bg-[#1c2333]">
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#94a3b8]">
                    Edad
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={child.age}
                    onChange={(e) =>
                      updateChild(
                        child.id,
                        "age",
                        Math.min(30, Math.max(0, Number(e.target.value)))
                      )
                    }
                    className="w-full rounded-xl border border-[#2d3548] bg-[#1c2333] px-4 py-2.5 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add child button */}
        <button
          onClick={addChild}
          disabled={children.length >= 10}
          className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-[#2d3548] bg-[#0f1117]/50 px-4 py-3 w-full justify-center text-sm font-medium text-[#94a3b8] transition-all hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Agregar hijo/a
          {children.length >= 10 && (
            <span className="text-xs text-[#64748b]">(maximo 10)</span>
          )}
        </button>

        {/* ---- MASCOTAS ---- */}
        <div className="mt-6 pt-6 border-t border-[#2d3548]/50">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🐾</span>
            <h3 className="text-sm font-semibold text-[#e2e8f0]">Mascotas</h3>
            {pets.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                {pets.length}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {pets.map((pet, index) => {
              const petEmoji =
                pet.type === "Perro" ? "🐕" :
                pet.type === "Gato" ? "🐈" :
                pet.type === "Ave" ? "🦜" :
                pet.type === "Reptil" ? "🦎" : "🐾";

              return (
                <div
                  key={pet.id}
                  className="rounded-xl border border-[#2d3548] bg-[#0f1117] p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{petEmoji}</span>
                      <span className="text-sm font-medium text-[#e2e8f0]">
                        Mascota {index + 1}
                      </span>
                    </div>
                    <button
                      onClick={() => removePet(pet.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#94a3b8]">Tipo</label>
                      <select
                        value={pet.type}
                        onChange={(e) => updatePet(pet.id, "type", e.target.value)}
                        className="w-full rounded-xl border border-[#2d3548] bg-[#1c2333] px-3 py-2.5 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors appearance-none"
                      >
                        {petTypeOptions.map((t) => (
                          <option key={t} value={t} className="bg-[#1c2333]">{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#94a3b8]">Nombre</label>
                      <input
                        type="text"
                        value={pet.name}
                        onChange={(e) => updatePet(pet.id, "name", e.target.value)}
                        placeholder="Nombre"
                        className="w-full rounded-xl border border-[#2d3548] bg-[#1c2333] px-3 py-2.5 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#94a3b8]">Edad (anos)</label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={pet.age}
                        onChange={(e) =>
                          updatePet(pet.id, "age", Math.min(30, Math.max(0, Number(e.target.value))))
                        }
                        className="w-full rounded-xl border border-[#2d3548] bg-[#1c2333] px-3 py-2.5 text-sm text-[#e2e8f0] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={addPet}
            disabled={pets.length >= 10}
            className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-[#2d3548] bg-[#0f1117]/50 px-4 py-3 w-full justify-center text-sm font-medium text-[#94a3b8] transition-all hover:border-amber-500/50 hover:text-amber-400 hover:bg-amber-500/5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="text-base">🐾</span>
            Agregar mascota
            {pets.length >= 10 && (
              <span className="text-xs text-[#64748b]">(maximo 10)</span>
            )}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  4. CONSENTIMIENTOS                                           */}
      {/* ============================================================ */}
      <div className="rounded-2xl border border-[#2d3548] bg-[#1c2333] p-6">
        <h2 className="text-lg font-semibold text-[#e2e8f0] mb-1">
          Consentimientos y Permisos
        </h2>
        <p className="text-sm text-[#94a3b8] mb-5">
          Controla como se utilizan tus datos personales
        </p>

        <div className="space-y-4">
          {consents.map((consent) => {
            const Icon = consent.icon;
            return (
              <div
                key={consent.id}
                className="flex items-start gap-4 rounded-xl border border-[#2d3548] bg-[#0f1117] p-4"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1c2333]">
                  <Icon className="h-4 w-4 text-[#94a3b8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#e2e8f0]">
                    {consent.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[#94a3b8]">
                    {consent.description}
                  </p>
                </div>
                <ToggleSwitch
                  enabled={consent.enabled}
                  onToggle={() => handleToggle(consent.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  5. ZONA DE PELIGRO                                           */}
      {/* ============================================================ */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5" />
          Zona de peligro
        </h2>
        <p className="text-sm text-[#94a3b8] mb-4">
          Estas acciones son irreversibles. Se eliminaran permanentemente tu
          cuenta, polizas, documentos y todo el historial asociado.
        </p>

        <div className="flex flex-wrap gap-3">
          {/* Export data */}
          <button className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-400 transition-all hover:bg-cyan-500/20 hover:border-cyan-500/50">
            <Download className="h-4 w-4" />
            Exportar mis datos
          </button>

          {/* Delete account */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500/50"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar mi cuenta
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5">
              <span className="text-sm text-red-400 font-medium mr-2">
                Estas seguro?
              </span>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg bg-[#2d3548] px-3 py-1.5 text-xs font-medium text-[#e2e8f0] hover:bg-[#3d4a63] transition-colors"
              >
                No, cancelar
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  // In a real app, this would delete the account
                }}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 transition-colors"
              >
                Si, eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
