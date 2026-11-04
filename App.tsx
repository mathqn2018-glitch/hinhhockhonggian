import React, { useState, useEffect } from 'react';
import { Edu3DModel, EduLesson, EduPanorama } from './types/model';
import { StorageService } from './services/storageService';
import {
  fetchSupabaseModels,
  fetchSupabaseLessons,
  fetchModelByIdFromSupabase,
  fetchLessonByIdFromSupabase,
  fetchPanoramaByIdFromSupabase,
} from './services/supabaseService';
import { Navbar, NavTab } from './components/ui/Navbar';
import { HomeView } from './components/views/HomeView';
import { LibraryView } from './components/views/LibraryView';
import { ModelDetailView } from './components/views/ModelDetailView';
import { ClassroomView } from './components/views/ClassroomView';
import { PanoramaView } from './components/views/PanoramaView';
import { UploadView } from './components/views/UploadView';
import { GuideView } from './components/views/GuideView';
import { ModelViewerAR } from './components/3d/ModelViewerAR';
import { QrShareModal } from './components/ui/QrShareModal';
import { AlertTriangle, Loader2, Sparkles, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [userRole, setUserRole] = useState<'teacher' | 'student'>('teacher');
  const [models, setModels] = useState<Edu3DModel[]>([]);
  const [lessons, setLessons] = useState<EduLesson[]>([]);

  // Deep link states
  const [isResolvingDeepLink, setIsResolvingDeepLink] = useState<boolean>(false);
  const [deepLinkError, setDeepLinkError] = useState<string | null>(null);
  const [deepLinkLesson, setDeepLinkLesson] = useState<EduLesson | null>(null);
  const [deepLinkPanoramaId, setDeepLinkPanoramaId] = useState<string | null>(null);

  // Active 3D Viewer & AR states
  const [selectedModel, setSelectedModel] = useState<Edu3DModel | null>(null);
  const [arModel, setArModel] = useState<Edu3DModel | null>(null);

  // QR Share Modal state
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    model?: Edu3DModel;
    lesson?: EduLesson;
    panorama?: EduPanorama;
  }>({ isOpen: false });

  // Initialize data and deep linking query parameters (?model=... & ?lesson=...)
  useEffect(() => {
    const loadedModels = StorageService.getAllModels();
    const loadedLessons = StorageService.getAllLessons();
    const savedRole = StorageService.getUserRole();

    setModels(loadedModels);
    setLessons(loadedLessons);
    setUserRole(savedRole);

    // Asynchronously fetch shared public models and lessons from Supabase Cloud
    fetchSupabaseModels().then((cloudModels) => {
      if (cloudModels && cloudModels.length > 0) {
        setModels((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes = cloudModels.filter((cm) => !existingIds.has(cm.id));
          return [...prev, ...newOnes];
        });
      }
    });

    fetchSupabaseLessons().then((cloudLessons) => {
      if (cloudLessons && cloudLessons.length > 0) {
        setLessons((prev) => {
          const existingIds = new Set(prev.map((l) => l.id));
          const newOnes = cloudLessons.filter((cl) => !existingIds.has(cl.id));
          return [...prev, ...newOnes];
        });
      }
    });

    // Handle deep linking for QR code scans
    const searchParams = new URLSearchParams(window.location.search);
    const modelParam = searchParams.get('model');
    const lessonParam = searchParams.get('lesson');
    const panoParam = searchParams.get('pano') || searchParams.get('panorama');
    const modeParam = searchParams.get('mode');

    if (panoParam) {
      // 1. Check local panoramas first
      const loadedPanos = StorageService.getAllPanoramas();
      const localPano = loadedPanos.find((p) => p.id === panoParam);
      if (localPano) {
        setDeepLinkPanoramaId(localPano.id);
        setActiveTab('panorama');
      } else {
        // 2. Fetch directly from Supabase Cloud
        setIsResolvingDeepLink(true);
        fetchPanoramaByIdFromSupabase(panoParam)
          .then((cloudPano) => {
            if (cloudPano) {
              StorageService.savePanorama(cloudPano);
              setDeepLinkPanoramaId(cloudPano.id);
              setActiveTab('panorama');
            } else {
              setDeepLinkError(
                `Không tìm thấy ảnh Panorama 360° với mã "${panoParam}". Có thể ảnh chưa được tải lên Supabase Cloud hoặc liên kết chia sẻ đã bị xóa.`
              );
            }
          })
          .catch((err) => {
            console.error('Lỗi tải ảnh 360 từ deep link:', err);
            setDeepLinkError('Lỗi khi tải ảnh 360° từ hệ thống đám mây. Vui lòng kiểm tra lại kết nối mạng.');
          })
          .finally(() => {
            setIsResolvingDeepLink(false);
          });
      }
    } else if (modelParam) {
      // 1. Check local models first
      const localTarget = loadedModels.find((m) => m.id === modelParam);
      if (localTarget) {
        if (modeParam === 'ar') {
          setArModel(localTarget);
        } else {
          setSelectedModel(localTarget);
        }
      } else {
        // 2. Fetch directly from Supabase Cloud
        setIsResolvingDeepLink(true);
        fetchModelByIdFromSupabase(modelParam)
          .then((cloudModel) => {
            if (cloudModel) {
              setModels((prev) => [cloudModel, ...prev.filter((m) => m.id !== cloudModel.id)]);
              if (modeParam === 'ar') {
                setArModel(cloudModel);
              } else {
                setSelectedModel(cloudModel);
              }
            } else {
              setDeepLinkError(
                `Không tìm thấy mô hình 3D với mã "${modelParam}". Có thể mô hình chưa được tải lên Supabase Cloud hoặc liên kết chia sẻ đã bị xóa.`
              );
            }
          })
          .catch((err) => {
            console.error('Lỗi tải mô hình từ deep link:', err);
            setDeepLinkError(
              `Lỗi khi tải mô hình từ hệ thống đám mây. Vui lòng kiểm tra lại kết nối mạng.`
            );
          })
          .finally(() => {
            setIsResolvingDeepLink(false);
          });
      }
    } else if (lessonParam) {
      // 1. Check local lessons first
      const localLesson = loadedLessons.find((l) => l.id === lessonParam);
      if (localLesson) {
        setDeepLinkLesson(localLesson);
        setActiveTab('classroom');
      } else {
        // 2. Fetch directly from Supabase Cloud
        setIsResolvingDeepLink(true);
        fetchLessonByIdFromSupabase(lessonParam)
          .then((cloudLesson) => {
            if (cloudLesson) {
              setLessons((prev) => [cloudLesson, ...prev.filter((l) => l.id !== cloudLesson.id)]);
              setDeepLinkLesson(cloudLesson);
              setActiveTab('classroom');
            } else {
              setDeepLinkError(
                `Không tìm thấy bài học với mã "${lessonParam}". Có thể bài học chưa được đồng bộ lên Supabase Cloud.`
              );
            }
          })
          .catch((err) => {
            console.error('Lỗi tải bài học từ deep link:', err);
            setDeepLinkError(
              `Lỗi khi tải bài học từ hệ thống đám mây. Vui lòng kiểm tra kết nối mạng.`
            );
          })
          .finally(() => {
            setIsResolvingDeepLink(false);
          });
      }
    }
  }, []);

  const handleToggleRole = () => {
    const nextRole = userRole === 'teacher' ? 'student' : 'teacher';
    setUserRole(nextRole);
    StorageService.setUserRole(nextRole);
  };

  const handleOpen3D = (model: Edu3DModel) => {
    setSelectedModel(model);
  };

  const handleOpenAR = (model: Edu3DModel) => {
    setArModel(model);
  };

  const handleShareModelQr = (model: Edu3DModel) => {
    setQrModalData({
      isOpen: true,
      model,
    });
  };

  const handleShareLessonQr = (lesson: EduLesson) => {
    setQrModalData({
      isOpen: true,
      lesson,
    });
  };

  const handleSharePanoramaQr = (panorama: EduPanorama) => {
    setQrModalData({
      isOpen: true,
      panorama,
    });
  };

  const handleModelSaved = (newModel: Edu3DModel) => {
    setModels(StorageService.getAllModels());
  };

  const handleSaveNewLesson = (newLesson: EduLesson) => {
    StorageService.saveLesson(newLesson);
    setLessons(StorageService.getAllLessons());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Primary Navigation Bar (hidden during active 3D model full inspection to maximize screen) */}
      {!selectedModel && (
        <Navbar
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            setSelectedModel(null);
          }}
          userRole={userRole}
          onToggleRole={handleToggleRole}
        />
      )}

      {/* Deep Link Error Notification Banner */}
      {deepLinkError && (
        <div className="bg-rose-950/90 border-b border-rose-500/40 text-rose-200 px-4 py-3 flex items-center justify-between z-30">
          <div className="flex items-center space-x-3 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{deepLinkError}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setDeepLinkError(null);
                setActiveTab('library');
                window.history.replaceState({}, '', window.location.pathname);
              }}
              className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg text-xs font-semibold"
            >
              Xem Thư Viện
            </button>
            <button
              onClick={() => setDeepLinkError(null)}
              className="p-1 text-rose-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Deep Link Loading State */}
      {isResolvingDeepLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md text-white">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center space-y-4 shadow-2xl max-w-sm text-center">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <div className="space-y-1">
              <h4 className="font-bold text-base text-white">Đang Kết Nối Mô Hình 3D Cloud...</h4>
              <p className="text-xs text-slate-400">
                Đang nạp dữ liệu từ máy chủ đám mây Supabase cho học sinh. Vui lòng đợi trong giây lát.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main View Switcher */}
      <main className="flex-1">
        {selectedModel ? (
          <ModelDetailView
            model={selectedModel}
            onBack={() => {
              setSelectedModel(null);
              window.history.replaceState({}, '', window.location.pathname);
            }}
            onOpenAR={(m) => setArModel(m)}
            onShareQr={(m) => handleShareModelQr(m)}
          />
        ) : activeTab === 'home' ? (
          <HomeView
            models={models}
            onOpen3D={handleOpen3D}
            onOpenAR={handleOpenAR}
            onShareQr={handleShareModelQr}
            onNavigateLibrary={() => setActiveTab('library')}
            onNavigateClassroom={() => setActiveTab('classroom')}
            onNavigatePanorama={() => setActiveTab('panorama')}
            onNavigateUpload={() => setActiveTab('upload')}
          />
        ) : activeTab === 'library' ? (
          <LibraryView
            models={models}
            onOpen3D={handleOpen3D}
            onOpenAR={handleOpenAR}
            onShareQr={handleShareModelQr}
            onCreateLesson={(m) => {
              setActiveTab('classroom');
            }}
            onNavigateUpload={() => setActiveTab('upload')}
          />
        ) : activeTab === 'panorama' ? (
          <PanoramaView
            userRole={userRole}
            onShareQr={handleSharePanoramaQr}
            initialPanoramaId={deepLinkPanoramaId}
          />
        ) : activeTab === 'classroom' ? (
          <ClassroomView
            models={models}
            lessons={lessons}
            initialLesson={deepLinkLesson}
            onOpenAR={handleOpenAR}
            onShareLessonQr={handleShareLessonQr}
            onSaveNewLesson={handleSaveNewLesson}
            userRole={userRole}
          />
        ) : activeTab === 'upload' ? (
          <UploadView
            onModelSaved={handleModelSaved}
            onOpen3D={handleOpen3D}
            onShareQr={handleShareModelQr}
          />
        ) : (
          <GuideView />
        )}
      </main>

      {/* Footer at the bottom */}
      <footer className="w-full py-4 bg-slate-950 border-t border-slate-900/80 text-center select-none z-20">
        <p className="text-xs sm:text-sm font-semibold text-pink-400 tracking-wide">
          Phát triển bởi Phan Thị Ngọc Thái
        </p>
      </footer>


      {/* Augmented Reality (AR) Overlay Modal */}
      {arModel && (
        <ModelViewerAR
          model={arModel}
          onClose={() => setArModel(null)}
        />
      )}

      {/* High-Resolution QR Share Modal */}
      <QrShareModal
        isOpen={qrModalData.isOpen}
        model={qrModalData.model}
        lesson={qrModalData.lesson}
        panorama={qrModalData.panorama}
        onClose={() => setQrModalData({ isOpen: false })}
      />
    </div>
  );
}
