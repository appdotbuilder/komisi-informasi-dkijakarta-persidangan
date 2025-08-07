
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { Plus, Users, Building, User, Mail, Phone, MapPin } from 'lucide-react';
import type { Dispute, Party, CreatePartyInput } from '../../../server/src/schema';

interface PartyManagementProps {
  disputes: Dispute[];
  userRole: string;
}

export function PartyManagement({ disputes, userRole }: PartyManagementProps) {
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [formData, setFormData] = useState<CreatePartyInput>({
    name: '',
    party_type: 'individu',
    address: null,
    phone: null,
    email: null,
    role: 'pemohon',
    dispute_id: 0
  });

  const canCreateParty = ['staf_komisi', 'panitera'].includes(userRole);

  const loadParties = useCallback(async (disputeId: number) => {
    setIsLoading(true);
    try {
      const result = await trpc.getPartiesByDispute.query({ dispute_id: disputeId });
      setParties(result);
    } catch (error) {
      console.error('Failed to load parties:', error);
      setParties([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDispute) {
      loadParties(selectedDispute);
    } else {
      setParties([]);
    }
  }, [selectedDispute, loadParties]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createParty.mutate(formData);
      if (selectedDispute) {
        await loadParties(selectedDispute);
      }
      setFormData({
        name: '',
        party_type: 'individu',
        address: null,
        phone: null,
        email: null,
        role: 'pemohon',
        dispute_id: selectedDispute || 0
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create party:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    if (selectedDispute) {
      setFormData({
        name: '',
        party_type: 'individu',
        address: null,
        phone: null,
        email: null,
        role: 'pemohon',
        dispute_id: selectedDispute
      });
      setShowCreateDialog(true);
    }
  };

  const getSelectedDisputeInfo = () => {
    if (!selectedDispute) return null;
    return disputes.find(d => d.id === selectedDispute);
  };

  const getPartyTypeLabel = (type: string) => {
    switch (type) {
      case 'individu': return 'Individu';
      case 'badan_hukum': return 'Badan Hukum';
      default: return type;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'pemohon': return 'Pemohon';
      case 'termohon': return 'Termohon';
      case 'turut_termohon': return 'Turut Termohon';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'pemohon': return 'default';
      case 'termohon': return 'secondary';
      case 'turut_termohon': return 'outline';
      default: return 'outline';
    }
  };

  const groupPartiesByRole = (parties: Party[]) => {
    return parties.reduce((acc, party) => {
      if (!acc[party.role]) {
        acc[party.role] = [];
      }
      acc[party.role].push(party);
      return acc;
    }, {} as Record<string, Party[]>);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Manajemen Pihak Berperkara
              </CardTitle>
              <CardDescription>
                Kelola data pihak-pihak yang terlibat dalam sengketa informasi
              </CardDescription>
            </div>
            {canCreateParty && selectedDispute && (
              <Button onClick={openCreateDialog} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tambah Pihak
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="dispute_select">Pilih Sengketa</Label>
            <Select
              value={selectedDispute?.toString() || ''}
              onValueChange={(value: string) => setSelectedDispute(value ? parseInt(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih sengketa untuk melihat pihak berperkara" />
              </SelectTrigger>
              <SelectContent>
                {disputes.map((dispute: Dispute) => (
                  <SelectItem key={dispute.id} value={dispute.id.toString()}>
                    {dispute.dispute_number} - {dispute.dispute_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDispute && getSelectedDisputeInfo() && (
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-900">
                  Informasi Sengketa
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">Nomor:</span>{' '}
                    {getSelectedDisputeInfo()?.dispute_number}
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Status:</span>{' '}
                    <Badge variant="outline" className="ml-1">
                      {getSelectedDisputeInfo()?.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedDispute ? (
            <Alert>
              <AlertDescription>
                Pilih sengketa untuk melihat pihak berperkara.
              </AlertDescription>
            </Alert>
          ) : isLoading ? (
            <Alert>
              <AlertDescription>Memuat data pihak berperkara...</AlertDescription>
            </Alert>
          ) : parties.length === 0 ? (
            <Alert>
              <AlertDescription>
                Belum ada pihak berperkara untuk sengketa ini.
                {canCreateParty && ' Klik tombol "Tambah Pihak" untuk menambahkan pihak baru.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupPartiesByRole(parties)).map(([role, roleParties]) => (
                <div key={role}>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={getRoleBadgeVariant(role)} className="text-sm">
                      {getRoleLabel(role)}
                    </Badge>
                    <span className="text-sm text-gray-500">({roleParties.length} pihak)</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roleParties.map((party: Party) => (
                      <Card key={party.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              {party.party_type === 'individu' ? (
                                <User className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Building className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {party.name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">
                                {getPartyTypeLabel(party.party_type)}
                              </p>
                              
                              <div className="space-y-2 text-sm">
                                {party.address && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span className="truncate">{party.address}</span>
                                  </div>
                                )}
                                {party.phone && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span>{party.phone}</span>
                                  </div>
                                )}
                                {party.email && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="truncate">{party.email}</span>
                                  </div>
                                )}
                              </div>

                              <div className="text-xs text-gray-400 mt-3 pt-3 border-t">
                                Ditambahkan: {party.created_at.toLocaleDateString('id-ID')}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pihak Berperkara</DialogTitle>
            <DialogDescription>
              Tambahkan pihak baru untuk sengketa {getSelectedDisputeInfo()?.dispute_number}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePartyInput) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nama lengkap pihak"
                required
              />
            </div>
            <div>
              <Label htmlFor="party_type">Jenis Pihak</Label>
              <Select
                value={formData.party_type || 'individu'}
                onValueChange={(value: 'individu' | 'badan_hukum') =>
                  setFormData((prev: CreatePartyInput) => ({ ...prev, party_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individu">Individu</SelectItem>
                  <SelectItem value="badan_hukum">Badan Hukum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="role">Peran</Label>
              <Select
                value={formData.role || 'pemohon'}
                onValueChange={(value: 'pemohon' | 'termohon' | 'turut_termohon') =>
                  setFormData((prev: CreatePartyInput) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pemohon">Pemohon</SelectItem>
                  <SelectItem value="termohon">Termohon</SelectItem>
                  <SelectItem value="turut_termohon">Turut Termohon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="address">Alamat</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePartyInput) => ({ 
                    ...prev, 
                    address: e.target.value || null 
                  }))
                }
                placeholder="Alamat lengkap (opsional)"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePartyInput) => ({ 
                    ...prev, 
                    phone: e.target.value || null 
                  }))
                }
                placeholder="Nomor telepon (opsional)"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePartyInput) => ({ 
                    ...prev, 
                    email: e.target.value || null 
                  }))
                }
                placeholder="Alamat email (opsional)"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
