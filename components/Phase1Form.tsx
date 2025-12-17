import React, { useState } from 'react';
import { Phase1Input, GradeLevel, SubjectArea } from '../types';

interface Phase1FormProps {
  onNext: (data: Phase1Input) => void;
  isLoading: boolean;
}

export const Phase1Form: React.FC<Phase1FormProps> = ({ onNext, isLoading }) => {
  const [formData, setFormData] = useState<Phase1Input>({
    topic: '',
    product: '',
    area: 'STEM',
    grade: '1r ESO',
    duration: 12,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    if (!formData.topic.trim()) {
      newErrors.topic = "Aquest camp és obligatori.";
      isValid = false;
    }

    if (!formData.product.trim()) {
      newErrors.product = "Aquest camp és obligatori.";
      isValid = false;
    }

    if (!formData.duration || formData.duration < 1) {
      newErrors.duration = "La durada ha de ser d'almenys 1 hora.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border border-blue-200">1</span>
        Contextualització
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">Idea o Tema Central</label>
          <input
            type="text"
            className={`w-full px-4 py-3 border rounded-lg text-slate-900 bg-[#FAFDFE] placeholder-[#AAB4C8] focus:ring-2 outline-none transition shadow-sm ${
              errors.topic 
                ? 'border-red-400 focus:ring-red-200 focus:border-red-500' 
                : 'border-slate-400 focus:ring-blue-500 focus:border-blue-600 hover:border-slate-500'
            }`}
            placeholder="ex: La contaminació de l'aire al barri"
            value={formData.topic}
            onChange={(e) => {
              setFormData({ ...formData, topic: e.target.value });
              if (errors.topic) setErrors({ ...errors, topic: '' });
            }}
          />
          {errors.topic && <p className="text-red-600 text-sm mt-1 font-medium">{errors.topic}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">Producte Final o Repte</label>
          <input
            type="text"
            className={`w-full px-4 py-3 border rounded-lg text-slate-900 bg-[#FAFDFE] placeholder-[#AAB4C8] focus:ring-2 outline-none transition shadow-sm ${
              errors.product 
                ? 'border-red-400 focus:ring-red-200 focus:border-red-500' 
                : 'border-slate-400 focus:ring-blue-500 focus:border-blue-600 hover:border-slate-500'
            }`}
            placeholder="ex: Un informe científic i una campanya de conscienciació"
            value={formData.product}
            onChange={(e) => {
              setFormData({ ...formData, product: e.target.value });
              if (errors.product) setErrors({ ...errors, product: '' });
            }}
          />
          {errors.product && <p className="text-red-600 text-sm mt-1 font-medium">{errors.product}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Àmbit Principal</label>
            <div className="relative">
              <select
                className="w-full px-4 py-3 border border-slate-400 rounded-lg text-slate-900 bg-[#FAFDFE] focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-none transition shadow-sm appearance-none hover:border-slate-500"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value as SubjectArea })}
              >
                <option value="STEM">Ciència, Tecnologia i Matemàtiques (STEM)</option>
                <option value="Lingüístic">Lingüístic i Comunicatiu</option>
                <option value="Social i Artístic">Social i Artístic</option>
                <option value="Transversal">Projecte Transversal</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Curs</label>
            <div className="relative">
              <select
                className="w-full px-4 py-3 border border-slate-400 rounded-lg text-slate-900 bg-[#FAFDFE] focus:ring-2 focus:ring-blue-500 focus:border-blue-600 outline-none transition shadow-sm appearance-none hover:border-slate-500"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value as GradeLevel })}
              >
                <option value="1r ESO">1r ESO</option>
                <option value="2n ESO">2n ESO</option>
                <option value="3r ESO">3r ESO</option>
                <option value="4t ESO">4t ESO</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Durada (hores)</label>
            <input
              type="number"
              min="1"
              max="200"
              className={`w-full px-4 py-3 border rounded-lg text-slate-900 bg-[#FAFDFE] focus:ring-2 outline-none transition shadow-sm ${
                errors.duration 
                  ? 'border-red-400 focus:ring-red-200 focus:border-red-500' 
                  : 'border-slate-400 focus:ring-blue-500 focus:border-blue-600 hover:border-slate-500'
              }`}
              value={formData.duration}
              onChange={(e) => {
                setFormData({ ...formData, duration: parseInt(e.target.value) || 0 });
                if (errors.duration) setErrors({ ...errors, duration: '' });
              }}
            />
            {errors.duration && <p className="text-red-600 text-sm mt-1 font-medium">{errors.duration}</p>}
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 px-6 rounded-lg font-bold text-white transition-all shadow-md text-lg
              ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800 hover:shadow-lg transform hover:-translate-y-0.5 border border-blue-800'}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generant Estructura...
              </span>
            ) : (
              'Generar Estructura Curricular'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};