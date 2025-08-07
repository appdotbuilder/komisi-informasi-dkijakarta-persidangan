
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { DisputeManagement } from '@/components/DisputeManagement';
import { HearingHistory } from '@/components/HearingHistory';
import { PartyManagement } from '@/components/PartyManagement';
import { UserManagement } from '@/components/UserManagement';
import type { Dispute, User } from '../../server/src/schema';
import { Scale, Users, Calendar, FileText, Shield, AlertCircle } from 'lucide-react';

function App() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Load current user from authentication system
  useEffect(() => {
    setCurrentUser({
      id: 1,
      username: 'admin',
      email: 'admin@komisiinformasi.jakarta.go.id',
      full_name: 'Administrator Komisi Informasi',
      role: 'staf_komisi',
      phone: '+62-21-12345678',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  }, []);

  const loadDisputes = useCallback(async () => {
    try {
      const result = await trpc.getDisputes.query();
      setDisputes(result);
    } catch (error) {
      console.error('Failed to load disputes:', error);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadDisputes();
    }
  }, [loadDisputes, currentUser]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'baru': return 'secondary';
      case 'sedang_berjalan': return 'default';
      case 'selesai': return 'outline';
      case 'ditutup': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'baru': return 'Baru';
      case 'sedang_berjalan': return 'Sedang Berjalan';
      case 'selesai': return 'Selesai';
      case 'ditutup': return 'Ditutup';
      default: return status;
    }
  };

  const getDisputeTypeLabel = (type: string) => {
    switch (type) {
      case 'sengketa_informasi': return 'Sengketa Informasi';
      case 'keberatan': return 'Keberatan';
      case 'banding': return 'Banding';
      default: return type;
    }
  };

  const canAccessModule = (module: string): boolean => {
    if (!currentUser) return false;
    
    const userRole = currentUser.role;
    
    switch (module) {
      case 'user_management':
        return userRole === 'staf_komisi';
      case 'dispute_management':
        return ['staf_komisi', 'komisioner', 'panitera'].includes(userRole);
      case 'hearing_management':
        return ['staf_komisi', 'komisioner', 'panitera'].includes(userRole);
      case 'party_management':
        return ['staf_komisi', 'panitera'].includes(userRole);
      default:
        return true;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <Scale className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <CardTitle className="text-xl">Sistem Informasi Persidangan</CardTitle>
            <CardDescription>Komisi Informasi DKI Jakarta</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">Loading user information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Scale className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Sistem Informasi Persidangan
                </h1>
                <p className="text-sm text-gray-600">Komisi Informasi DKI Jakarta</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser.full_name}</p>
                <Badge variant="outline" className="text-xs">
                  {currentUser.role.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <Shield className="h-6 w-6 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="disputes" 
              className="flex items-center gap-2"
              disabled={!canAccessModule('dispute_management')}
            >
              <Scale className="h-4 w-4" />
              Sengketa
            </TabsTrigger>
            <TabsTrigger 
              value="hearings" 
              className="flex items-center gap-2"
              disabled={!canAccessModule('hearing_management')}
            >
              <Calendar className="h-4 w-4" />
              Persidangan
            </TabsTrigger>
            <TabsTrigger 
              value="parties" 
              className="flex items-center gap-2"
              disabled={!canAccessModule('party_management')}
            >
              <Users className="h-4 w-4" />
              Pihak Berperkara
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2"
              disabled={!canAccessModule('user_management')}
            >
              <Shield className="h-4 w-4" />
              Pengguna
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Sengketa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{disputes.length}</div>
                  <p className="text-xs text-blue-100">+2 dari bulan lalu</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Selesai</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {disputes.filter(d => d.status === 'selesai').length}
                  </div>
                  <p className="text-xs text-green-100">Sengketa diselesaikan</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Sedang Berjalan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {disputes.filter(d => d.status === 'sedang_berjalan').length}
                  </div>
                  <p className="text-xs text-orange-100">Perlu tindak lanjut</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Baru</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {disputes.filter(d => d.status === 'baru').length}
                  </div>
                  <p className="text-xs text-purple-100">Menunggu proses</p>
                </CardContent>
              </Card>
            </div>

            {disputes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Belum Ada Data Sengketa
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Mulai dengan membuat data sengketa baru melalui tab Sengketa.
                  </p>
                  {canAccessModule('dispute_management') && (
                    <Button onClick={() => setActiveTab('disputes')}>
                      Buat Sengketa Baru
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Sengketa Terbaru
                  </CardTitle>
                  <CardDescription>
                    Daftar sengketa yang baru didaftarkan dan sedang berjalan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {disputes.slice(0, 5).map((dispute: Dispute) => (
                      <div key={dispute.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">
                              {dispute.dispute_number}
                            </h3>
                            <Badge variant={getStatusBadgeVariant(dispute.status)}>
                              {getStatusLabel(dispute.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {getDisputeTypeLabel(dispute.dispute_type)}
                          </p>
                          {dispute.description && (
                            <p className="text-sm text-gray-500">{dispute.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Didaftarkan: {dispute.registration_date.toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Lihat Detail
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Dispute Management */}
          <TabsContent value="disputes">
            <DisputeManagement 
              disputes={disputes} 
              onDisputesUpdate={loadDisputes}
              userRole={currentUser.role}
            />
          </TabsContent>

          {/* Hearing History */}
          <TabsContent value="hearings">
            <HearingHistory 
              disputes={disputes}
              userRole={currentUser.role}
            />
          </TabsContent>

          {/* Party Management */}
          <TabsContent value="parties">
            <PartyManagement 
              disputes={disputes}
              userRole={currentUser.role}
            />
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users">
            <UserManagement userRole={currentUser.role} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
