import React, { useState, useRef, useEffect } from 'react';
import { Plus, Film, Trash2, Edit3, Save, X, ExternalLink, Image as ImageIcon, Video as VideoIcon, Star, ShieldCheck, Loader2, Bell, Users } from 'lucide-react';
import { MOCK_SERIES, MOCK_VIDEOS } from '../mockData';
import { Series, Video } from '../types';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'series' | 'episodes' | 'notifications' | 'audience'>('series');
  const [isAddingSeries, setIsAddingSeries] = useState(false);
  const [seriesStep, setSeriesStep] = useState(1);
  const [episodeCount, setEpisodeCount] = useState(1);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Form State
  const [seriesData, setSeriesData] = useState({
    title: '',
    tags: [] as string[],
    description: '',
    verticalUrl: '',
    horizontalUrl: ''
  });

  const [episodesData, setEpisodesData] = useState<Array<{ title: string, videoUrl: string, thumbnailUrl: string }>>([]);

  const verticalInputRef = useRef<HTMLInputElement>(null);
  const horizontalInputRef = useRef<HTMLInputElement>(null);
  const episodeVideoRefs = useRef<Array<HTMLInputElement | null>>([]);
  const episodeThumbRefs = useRef<Array<HTMLInputElement | null>>([]);
  
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [featuredSeriesId, setFeaturedSeriesId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'info' });
  const [stats, setStats] = useState({ totalViews: 0, totalWatchTime: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [sRes, vRes, stRes, fRes, nRes, uRes] = await Promise.all([
        fetch('/api/series'),
        fetch('/api/videos'),
        fetch('/api/stats'),
        fetch('/api/featured'),
        fetch('/api/notifications'),
        fetch('/api/users')
      ]);
      const sData = await sRes.json();
      const vData = await vRes.json();
      const stData = await stRes.json();
      const fData = await fRes.json();
      const nData = await nRes.json();
      const uData = await uRes.json();
      
      if (Array.isArray(sData)) setSeriesList(sData);
      if (Array.isArray(vData)) setVideoList(vData);
      if (stData && !stData.error) setStats(stData);
      if (fData && !fData.error) setFeaturedSeriesId(fData?.id || fData?.featuredSeriesId || null);
      if (Array.isArray(nData)) setNotifications(nData);
      if (Array.isArray(uData)) setUserList(uData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notifForm.title || !notifForm.message) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifForm)
      });
      if (res.ok) {
         setNotifForm({ title: '', message: '', type: 'info' });
         fetchData();
      }
    } catch (e) {
      console.error('Failed to send notification');
    }
  };

  const handleDeleteNotification = async (id: string) => {
     try {
       await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
       setNotifications(prev => prev.filter(n => n.id !== id));
     } catch (e) {
        console.error('Failed to delete notification');
     }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSetFeatured = async (seriesId: string) => {
    try {
      const response = await fetch('/api/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesId })
      });
      if (response.ok) {
        setFeaturedSeriesId(seriesId);
      }
    } catch (error) {
       console.error('Failed to set featured series:', error);
    }
  };

  const resetSeriesForm = () => {
    setIsAddingSeries(false);
    setSeriesStep(1);
    setEpisodeCount(1);
    setSeriesData({ title: '', tags: [], description: '', verticalUrl: '', horizontalUrl: '' });
    setEpisodesData([]);
  };

  const handleFileUpload = async (file: File, type: 'vertical' | 'horizontal' | 'video' | 'thumb', index?: number) => {
    const uploadId = index !== undefined ? `${type}-${index}` : type;
    setIsUploading(uploadId);
    setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(prev => ({ ...prev, [uploadId]: percentComplete }));
          }
        };

        xhr.onload = () => {
          const contentType = xhr.getResponseHeader('content-type');
          if (xhr.status >= 200 && xhr.status < 300) {
            if (contentType && contentType.includes('application/json')) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              const text = xhr.responseText;
              if (text.includes('<!doctype html>') || text.includes('Authenticate in new window')) {
                reject(new Error('AUTH_REQUIRED'));
              } else {
                reject(new Error('Server returned non-JSON response'));
              }
            }
          } else {
            if (contentType && contentType.includes('application/json')) {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || 'Upload failed'));
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });

      if (type === 'vertical') {
        setSeriesData(prev => ({ ...prev, verticalUrl: data.url }));
      } else if (type === 'horizontal') {
        setSeriesData(prev => ({ ...prev, horizontalUrl: data.url }));
      } else if (index !== undefined) {
        setEpisodesData(prev => {
          const next = [...prev];
          if (!next[index]) next[index] = { title: '', videoUrl: '', thumbnailUrl: '' };
          if (type === 'video') next[index].videoUrl = data.url;
          if (type === 'thumb') next[index].thumbnailUrl = data.url;
          return next;
        });
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      if (error.message === 'AUTH_REQUIRED') {
        alert('Authentication Required: Your browser blocked a security cookie. Please open the application in a NEW TAB to continue uploading.');
      } else {
        alert(`Failed to upload file: ${error.message || 'Check your connection'}`);
      }
    } finally {
      setIsUploading(null);
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[uploadId];
        return next;
      });
    }
  };

  const initializeEpisodeData = () => {
    setEpisodesData(Array.from({ length: episodeCount }).map((_, i) => ({
      title: `Episode ${i + 1}`,
      videoUrl: '',
      thumbnailUrl: ''
    })));
    setSeriesStep(3);
  };

  const handlePublish = async () => {
    if (!seriesData.title || !seriesData.verticalUrl || !seriesData.horizontalUrl) {
      alert('Please provide title, vertical poster AND horizontal banner');
      return;
    }

    const incomplete = episodesData.find(ep => !ep.videoUrl);
    if (incomplete) {
      alert('Please upload video for all episodes');
      return;
    }

    try {
      const response = await fetch('/api/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          series: {
             title: seriesData.title,
             description: seriesData.description,
             verticalThumbnail: seriesData.verticalUrl,
             horizontalThumbnail: seriesData.horizontalUrl,
             tags: seriesData.tags
          },
          episodes: episodesData.map(ep => ({
            ...ep,
            thumbnailUrl: seriesData.verticalUrl // Use vertical poster as default episode thumbnail
          }))
        })
      });

      if (response.ok) {
        alert('Series Published Successfully!');
        fetchData();
        resetSeriesForm();
        setSeriesStep(1);
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to publish');
        } else {
          const text = await response.text();
          if (text.includes('<!doctype html>') || text.includes('Authenticate in new window')) {
            throw new Error('AUTH_REQUIRED');
          }
          throw new Error('Server returned non-JSON response');
        }
      }
    } catch (error: any) {
      console.error('Publish failed:', error);
      if (error.message === 'AUTH_REQUIRED') {
        alert('Action Required: Your browser blocked a security cookie. Please open the application in a NEW TAB to finish publishing your series.');
      } else {
        alert(`Failed to publish: ${error.message || 'Check console'}`);
      }
    }
  };

  const renderContent = () => {
    if (activeTab === 'series') {
      return (
        <div className="space-y-8">
           {/* Stats */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl border border-gray-100 flex items-center gap-5 group hover:border-indigo-100 transition-all">
                 <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-all">
                    <VideoIcon className="w-5 h-5 text-indigo-500 group-hover:text-white" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-gray-400 mb-0.5">Total Views</span>
                    <div className="flex items-baseline gap-1.5">
                       <span className="text-2xl font-display font-semibold text-gray-900">{(stats?.totalViews || 0).toLocaleString()}</span>
                       <span className="text-[10px] font-medium text-gray-300">plays</span>
                    </div>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 flex items-center gap-5 group hover:border-indigo-100 transition-all">
                 <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-all">
                    <ShieldCheck className="w-5 h-5 text-indigo-500 group-hover:text-white" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-gray-400 mb-0.5">Watch Time</span>
                    <div className="flex items-baseline gap-1.5">
                       <span className="text-2xl font-display font-semibold text-gray-900">{((stats?.totalWatchTime || 0) / 3600).toFixed(1)}</span>
                       <span className="text-[10px] font-medium text-gray-300">hours</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                 <h2 className="text-xl font-display font-semibold text-gray-900">Catalogue</h2>
                 <p className="text-xs text-gray-400 font-normal mt-0.5">Manage your series library</p>
              </div>
              <button 
               onClick={() => setIsAddingSeries(true)}
               className="bg-gray-900 text-white px-5 py-2.5 rounded-lg font-medium text-xs flex items-center gap-2 hover:bg-indigo-600 transition-all active:scale-[0.97]"
              >
                <Plus className="w-4 h-4" /> New Series
              </button>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
               {seriesList.map(series => (
                 <div key={series.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 group hover:shadow-md hover:border-gray-200/80 transition-all flex flex-col h-full">
                    <div className="relative aspect-[9/14] bg-gray-50 flex-shrink-0">
                       <img src={series.verticalThumbnail} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleSetFeatured(series.id)}
                            className={`p-2.5 rounded-lg hover:scale-105 transition-transform ${featuredSeriesId === series.id ? 'bg-amber-400 text-white' : 'bg-white text-gray-700 hover:bg-amber-50'}`}
                            title="Set as Featured"
                          >
                            <Star className={`w-4 h-4 ${featuredSeriesId === series.id ? 'fill-current' : ''}`} />
                          </button>
                          <button className="bg-white p-2.5 rounded-lg text-gray-700 hover:scale-105 transition-transform"><Edit3 className="w-4 h-4" /></button>
                          <button className="bg-red-500 p-2.5 rounded-lg text-white hover:scale-105 transition-transform"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                    <div className="p-3 md:p-4 flex-1 flex flex-col">
                       <h3 className="font-semibold text-sm mb-0.5 leading-tight line-clamp-1">{series.title}</h3>
                       <p className="text-[10px] text-gray-400 mb-2 line-clamp-2 font-normal">{series.description}</p>
                       <div className="flex items-center justify-between mt-auto">
                          <div className="flex flex-wrap gap-1">
                             {series.tags?.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[8px] font-medium bg-gray-50 px-1.5 py-0.5 rounded text-gray-400">{tag}</span>
                             ))}
                             {(series.tags?.length || 0) > 2 && <span className="text-[8px] font-medium text-gray-300">+{series.tags!.length - 2}</span>}
                          </div>
                          <span className="text-[10px] font-medium text-gray-500">{series.totalEpisodes} eps</span>
                       </div>
                    </div>
                 </div>
               ))}
           </div>
        </div>
      );
    }

    if (activeTab === 'episodes') {
      return (
        <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-semibold text-gray-900">Episodes</h2>
              <button 
               onClick={() => setIsAddingSeries(true)}
               className="bg-gray-900 text-white px-5 py-2 rounded-lg font-medium text-xs flex items-center gap-2 hover:bg-indigo-600 transition-colors active:scale-[0.97]"
              >
                <Plus className="w-4 h-4" /> Upload Episode
              </button>
           </div>

           <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                 <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                       <th className="px-6 py-4 text-[10px] font-medium text-gray-400">Content</th>
                       <th className="px-6 py-4 text-[10px] font-medium text-gray-400">Series</th>
                       <th className="px-6 py-4 text-[10px] font-medium text-gray-400">Stats</th>
                       <th className="px-6 py-4 text-[10px] font-medium text-gray-400">Cost</th>
                       <th className="px-6 py-4 text-[10px] font-medium text-gray-400">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {videoList.map((video) => (
                      <tr key={video.id} className="hover:bg-gray-50/50 transition-colors group">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-14 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 relative">
                                  <img src={video.thumbnailUrl} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                                     <VideoIcon className="w-3.5 h-3.5 text-white/80" />
                                  </div>
                               </div>
                               <div>
                                  <p className="font-medium text-sm text-gray-900">Ep {video.episodeNumber}: {video.title}</p>
                                  <p className="text-[9px] text-gray-300 font-normal mt-0.5">{video.videoUrl.split('/').pop()}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className="text-xs font-medium text-gray-400">{seriesList.find(s => s.id === video.seriesId)?.title || 'Unknown'}</span>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3 text-xs font-normal text-gray-400">
                               <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {video.likes || 0}</span>
                               <span>{video.comments || 0} comments</span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${video.coinsRequired > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                               {video.coinsRequired > 0 ? `${video.coinsRequired} coins` : 'Free'}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex gap-3">
                               <button className="text-gray-300 hover:text-gray-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                               <button className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      );
    }

    if (activeTab === 'notifications') {
      return (
        <div className="space-y-8">
           <div>
              <h2 className="text-xl font-display font-semibold text-gray-900">Notifications</h2>
              <p className="text-xs text-gray-400 font-normal mt-0.5">Send alerts to your audience</p>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                 <div className="bg-white p-6 rounded-xl border border-gray-100 sticky top-6">
                    <h3 className="text-sm font-display font-semibold text-gray-900 mb-5">New Notice</h3>
                    <div className="space-y-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-medium text-gray-400 pl-0.5">Title</label>
                          <input 
                             type="text" 
                             className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                             placeholder="e.g. System Update"
                             value={notifForm.title}
                             onChange={e => setNotifForm({...notifForm, title: e.target.value})}
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-medium text-gray-400 pl-0.5">Message</label>
                          <textarea 
                             className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-xs font-normal focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all h-28 resize-none"
                             placeholder="What's happening?"
                             value={notifForm.message}
                             onChange={e => setNotifForm({...notifForm, message: e.target.value})}
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-medium text-gray-400 pl-0.5">Type</label>
                          <select 
                             className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-[10px] font-medium appearance-none outline-none focus:ring-2 focus:ring-indigo-500/10"
                             value={notifForm.type}
                             onChange={e => setNotifForm({...notifForm, type: e.target.value})}
                          >
                             <option value="info">General Info</option>
                             <option value="promo">Promotion</option>
                             <option value="alert">Critical Alert</option>
                          </select>
                       </div>
                       <button 
                          onClick={handleSendNotification}
                          className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium text-xs hover:bg-indigo-600 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                       >
                          <Bell className="w-3.5 h-3.5" /> Send
                       </button>
                    </div>
                 </div>
              </div>

              <div className="lg:col-span-2">
                 <div className="space-y-3">
                    <h3 className="text-[10px] font-medium text-gray-400 pl-1 mb-2">History</h3>
                    {notifications.length === 0 ? (
                       <div className="p-16 text-center bg-white rounded-xl border border-gray-100 border-dashed">
                          <Bell className="w-10 h-10 text-gray-100 mx-auto mb-3" />
                          <p className="text-gray-300 text-xs font-medium">No notifications sent yet</p>
                       </div>
                    ) : notifications.map(notif => (
                       <div key={notif.id} className="bg-white border border-gray-100 rounded-xl p-5 group hover:border-indigo-100 transition-all flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                             <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-medium ${
                                   notif.type === 'alert' ? 'bg-red-50 text-red-500' : 
                                   notif.type === 'promo' ? 'bg-purple-50 text-purple-500' : 
                                   'bg-gray-50 text-gray-400'
                                }`}>
                                   {notif.type}
                                </span>
                                <span className="text-[8px] font-normal text-gray-300">
                                   {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString()}
                                </span>
                             </div>
                             <div>
                                <h4 className="text-sm font-semibold text-gray-900">{notif.title}</h4>
                                <p className="text-xs text-gray-400 font-normal leading-relaxed mt-0.5 max-w-xl">{notif.message}</p>
                             </div>
                          </div>
                          <button 
                             onClick={() => handleDeleteNotification(notif.id)}
                             className="p-2 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      );
    }

    if (activeTab === 'audience') {
      return (
        <div className="space-y-5">
            <div className="flex justify-between items-center">
               <div>
                  <h2 className="text-xl font-display font-semibold text-gray-900">Audience</h2>
                  <p className="text-xs text-gray-400 font-normal mt-0.5">Monitor platform users</p>
               </div>
               <div className="flex items-center gap-3">
                  <div className="bg-white px-4 py-2.5 rounded-lg border border-gray-100 flex items-center gap-2.5">
                     <Users className="w-4 h-4 text-indigo-500" />
                     <div className="flex flex-col">
                        <span className="text-[8px] font-medium text-gray-400 leading-none mb-0.5">Total</span>
                        <span className="text-sm font-semibold text-gray-900 leading-none">{userList.length}</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80">
                     <tr>
                        <th className="px-6 py-4 text-[10px] font-medium text-gray-400">User</th>
                        <th className="px-6 py-4 text-[10px] font-medium text-gray-400">Contact</th>
                        <th className="px-6 py-4 text-[10px] font-medium text-gray-400">Balance</th>
                        <th className="px-6 py-4 text-[10px] font-medium text-gray-400">Joined</th>
                        <th className="px-6 py-4 text-[10px] font-medium text-gray-400">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {userList.length === 0 ? (
                       <tr>
                          <td colSpan={5} className="px-6 py-16 text-center">
                             <Users className="w-10 h-10 text-gray-100 mx-auto mb-3" />
                             <p className="text-gray-300 text-xs font-medium">No users registered yet</p>
                          </td>
                       </tr>
                     ) : userList.map((usr) => (
                       <tr key={usr.email} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center font-display text-sm text-gray-400 border border-gray-100">
                                   {usr.name ? usr.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-sm font-medium text-gray-900">{usr.name || 'Anonymous'}</span>
                                   <span className="text-[10px] font-normal text-gray-400">{usr.email}</span>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className="text-xs font-normal text-gray-400">{usr.phone || 'Not provided'}</span>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-900">{usr.coins || 0} coins</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className="text-[10px] font-normal text-gray-400">
                                {new Date(usr.createdAt).toLocaleDateString()}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                             <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-500 text-[9px] font-medium border border-emerald-100">
                                Active
                             </span>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col font-sans text-gray-900">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center w-full">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-display font-bold shadow-sm">
                L
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-display font-semibold text-gray-900 leading-none">Dashboard</h1>
                <span className="text-[9px] font-normal text-gray-300 mt-0.5">v2.5.0</span>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                <button 
                  onClick={() => setActiveTab('series')}
                  className={`px-5 py-1.5 rounded-md text-[10px] font-medium transition-all ${activeTab === 'series' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Series
                </button>
                <button 
                  onClick={() => setActiveTab('episodes')}
                  className={`px-5 py-1.5 rounded-md text-[10px] font-medium transition-all ${activeTab === 'episodes' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Episodes
                </button>
                <button 
                  onClick={() => setActiveTab('notifications')}
                  className={`px-5 py-1.5 rounded-md text-[10px] font-medium transition-all ${activeTab === 'notifications' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Alerts
                </button>
                <button 
                  onClick={() => setActiveTab('audience')}
                  className={`px-5 py-1.5 rounded-md text-[10px] font-medium transition-all ${activeTab === 'audience' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Users
                </button>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all border border-gray-100">
                 <ExternalLink className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto w-full">
           {renderContent()}
        </div>
      </div>

      {/* Series Add Modal */}
      {isAddingSeries && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <div>
                    <div className="flex items-center gap-3 mb-1">
                       <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium ${seriesStep >= 1 ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'}`}>1</span>
                       <div className={`h-px w-6 ${seriesStep >= 2 ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                       <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium ${seriesStep >= 2 ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'}`}>2</span>
                       <div className={`h-px w-6 ${seriesStep >= 3 ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                       <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium ${seriesStep >= 3 ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'}`}>3</span>
                    </div>
                    <h2 className="text-lg font-display font-semibold text-gray-900">
                       {seriesStep === 1 && "Series Info"}
                       {seriesStep === 2 && "Episodes"}
                       {seriesStep === 3 && "Upload Content"}
                    </h2>
                 </div>
                 <button onClick={resetSeriesForm} className="bg-white p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <X className="w-4 h-4 text-gray-400" />
                 </button>
              </div>

              {/* Step 1 */}
              {seriesStep === 1 && (
                <div className="p-8 space-y-6">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-5">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-medium text-gray-400 pl-0.5">Vertical Poster (9:16)</label>
                            <input 
                                type="file" 
                                className="hidden" 
                                ref={verticalInputRef}
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'vertical')}
                            />
                            <div 
                              onClick={() => verticalInputRef.current?.click()}
                              className={`aspect-[9/16] bg-gray-50 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all group overflow-hidden relative ${seriesData.verticalUrl ? 'border-none' : ''}`}
                            >
                                {isUploading === 'vertical' ? (
                                   <div className="flex flex-col items-center gap-3 w-full px-6 text-center">
                                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-1" />
                                      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                         <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress['vertical'] || 0}%` }} />
                                      </div>
                                      <span className="text-[8px] font-medium text-indigo-500">{uploadProgress['vertical'] || 0}%</span>
                                   </div>
                                ) : seriesData.verticalUrl ? (
                                   <>
                                      <img src={seriesData.verticalUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                         <span className="text-[10px] font-medium text-white bg-black/30 px-3 py-1.5 rounded-lg border border-white/20">Change</span>
                                      </div>
                                   </>
                                ) : (
                                   <>
                                      <ImageIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                      <span className="text-[9px] font-medium">Select Poster</span>
                                   </>
                                )}
                            </div>
                         </div>

                         <div className="space-y-1.5">
                            <label className="text-[10px] font-medium text-gray-400 pl-0.5">Horizontal Banner (16:9)</label>
                            <input 
                                type="file" 
                                className="hidden" 
                                ref={horizontalInputRef}
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'horizontal')}
                            />
                            <div 
                              onClick={() => horizontalInputRef.current?.click()}
                              className={`aspect-[16/9] bg-gray-50 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all group overflow-hidden relative ${seriesData.horizontalUrl ? 'border-none' : ''}`}
                            >
                                {isUploading === 'horizontal' ? (
                                   <div className="flex flex-col items-center gap-3 w-full px-8 text-center">
                                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-1" />
                                      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                         <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress['horizontal'] || 0}%` }} />
                                      </div>
                                      <span className="text-[8px] font-medium text-indigo-500">{uploadProgress['horizontal'] || 0}%</span>
                                   </div>
                                ) : seriesData.horizontalUrl ? (
                                   <>
                                      <img src={seriesData.horizontalUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                         <span className="text-[10px] font-medium text-white bg-black/30 px-3 py-1.5 rounded-lg border border-white/20">Change</span>
                                      </div>
                                   </>
                                ) : (
                                   <>
                                      <ImageIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                      <span className="text-[9px] font-medium">Select Banner</span>
                                   </>
                                )}
                            </div>
                         </div>
                      </div>
                      <div className="space-y-5">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-medium text-gray-400 pl-0.5">Series Name</label>
                            <input 
                               type="text" 
                               value={seriesData.title}
                               onChange={(e) => setSeriesData(prev => ({ ...prev, title: e.target.value }))}
                               className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3.5 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm" 
                               placeholder="e.g. Forbidden Love" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-medium text-gray-400 pl-0.5">Tags</label>
                            <div className="flex flex-wrap gap-1.5">
                               {['Drama', 'Young Adult', 'Modern', 'Romantic', 'Steamy', 'Animal', 'Exciting', 'Suspense', 'CEO', 'Betrayal'].map(tag => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                       setSeriesData(prev => ({
                                          ...prev,
                                          tags: prev.tags.includes(tag) 
                                             ? prev.tags.filter(t => t !== tag)
                                             : [...prev.tags, tag]
                                       }));
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                                       seriesData.tags.includes(tag)
                                          ? 'bg-indigo-500 text-white shadow-sm'
                                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100'
                                    }`}
                                  >
                                     {tag}
                                  </button>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-medium text-gray-400 pl-0.5">Synopsis</label>
                            <textarea 
                               value={seriesData.description}
                               onChange={(e) => setSeriesData(prev => ({ ...prev, description: e.target.value }))}
                               className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3.5 font-normal text-sm h-28 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all resize-none" 
                               placeholder="Enter the story hook..."
                            ></textarea>
                         </div>
                         <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-medium text-blue-600">Admin Upload</span>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {/* Step 2 */}
              {seriesStep === 2 && (
                <div className="p-16 flex flex-col items-center justify-center space-y-8">
                   <div className="text-center space-y-3">
                      <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto">
                         <Film className="w-7 h-7 text-indigo-500" />
                      </div>
                      <h3 className="text-xl font-display font-semibold text-gray-900">How many episodes?</h3>
                      <p className="text-gray-400 font-normal text-sm">Select the initial episode count</p>
                   </div>
                   
                   <div className="flex items-center gap-6">
                      <button onClick={() => setEpisodeCount(Math.max(1, episodeCount - 1))} className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-xl font-display hover:bg-gray-100 transition-colors border border-gray-100">-</button>
                      <span className="text-5xl font-display font-semibold text-indigo-500 min-w-[100px] text-center">{episodeCount}</span>
                      <button onClick={() => setEpisodeCount(episodeCount + 1)} className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-xl font-display hover:bg-gray-100 transition-colors border border-gray-100">+</button>
                   </div>

                   <div className="flex flex-wrap justify-center gap-2">
                      {[10, 25, 50, 75, 100].map(val => (
                        <button key={val} onClick={() => setEpisodeCount(val)} className={`px-4 py-1.5 rounded-lg text-[10px] font-medium transition-all ${episodeCount === val ? 'bg-indigo-500 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100'}`}>
                           {val} eps
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {/* Step 3 */}
              {seriesStep === 3 && (
                <div className="p-8 space-y-5">
                   <div className="flex items-center justify-between mb-1">
                       <h3 className="text-sm font-semibold text-gray-900">Episodes ({episodeCount})</h3>
                       <span className="text-[10px] font-normal text-gray-400">Individual configuration</span>
                   </div>
                   <div className="flex-1 overflow-y-auto max-h-[50vh] pr-3 space-y-2 no-scrollbar">
                      {episodesData.map((ep, i) => (
                        <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4 group hover:border-indigo-200 transition-all">
                           <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center font-display text-sm text-indigo-500 border border-gray-100">
                             {i + 1}
                           </div>
                           <div className="flex-1 grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-medium text-gray-400">Title</label>
                                 <input 
                                    type="text" 
                                    value={ep.title}
                                    onChange={(e) => setEpisodesData(prev => {
                                      const next = [...prev];
                                      next[i].title = e.target.value;
                                      return next;
                                    })}
                                    className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium focus:border-indigo-500 outline-none" 
                                    placeholder={`Ep ${i+1} Title`} 
                                 />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-medium text-gray-400">Video File</label>
                                 <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="video/*"
                                    ref={el => episodeVideoRefs.current[i] = el}
                                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video', i)}
                                 />
                                 <button 
                                    onClick={() => episodeVideoRefs.current[i]?.click()}
                                    className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-[9px] font-medium flex items-center justify-between hover:bg-gray-50 transition-all overflow-hidden relative"
                                 >
                                    {isUploading === `video-${i}` ? (
                                       <>
                                          <div 
                                             className="absolute inset-y-0 left-0 bg-indigo-500/10 transition-all duration-300"
                                             style={{ width: `${uploadProgress[`video-${i}`] || 0}%` }}
                                          />
                                          <span className="relative z-10 text-indigo-500">{uploadProgress[`video-${i}`] || 0}%</span>
                                       </>
                                    ) : ep.videoUrl ? 'Ready ✓' : 'Browse'} 
                                    <VideoIcon className={`w-3 h-3 relative z-10 ${ep.videoUrl ? 'text-emerald-500' : 'text-gray-300'} ${isUploading === `video-${i}` ? 'animate-pulse text-indigo-300' : ''}`} />
                                 </button>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-8 py-5 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center">
                 <button 
                  onClick={() => seriesStep > 1 ? setSeriesStep(seriesStep - 1) : resetSeriesForm()}
                  className="px-5 py-2 font-medium text-xs text-gray-400 hover:text-gray-600 transition-colors"
                 >
                    {seriesStep === 1 ? "Cancel" : "Back"}
                 </button>
                 
                 <div className="flex gap-3">
                    {seriesStep < 3 ? (
                       <button 
                        onClick={() => seriesStep === 2 ? initializeEpisodeData() : setSeriesStep(seriesStep + 1)}
                        className="bg-gray-900 text-white px-7 py-2.5 rounded-lg font-medium text-xs hover:bg-indigo-600 transition-all active:scale-[0.97]"
                       >
                          Continue
                       </button>
                    ) : (
                       <button 
                        onClick={handlePublish}
                        className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-medium text-xs hover:bg-indigo-700 transition-all shadow-sm active:scale-[0.97]"
                       >
                          Publish Series
                       </button>
                    ) }
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
