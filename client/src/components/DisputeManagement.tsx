
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { Plus, Search, Eye, Edit, Calendar } from 'lucide-react';
import type { Dispute, CreateDisputeInput, UpdateDisputeInput } from '../../../server/src/schema';

interface DisputeManagementProps {
  disputes: Dispute[];
  onDisputesUpdate: () => Promise<void>;
  userRole: string;
}

export function DisputeManagement({ disputes, onDisputesUpdate, userRole }: DisputeManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDispute, setEditingDispute] = useState<Dispute | null>(null);

  const [formData, setFormData] = useState<CreateDisputeInput>({
    dispute_number: '',
    dispute_type: 'sengketa_informasi',
    registration_date: new Date(),
    description: null,
    status: 'baru'
  });

  const [editFormData, setEditFormData] = useState<UpdateDisputeInput>({
    id: 0,
    dispute_number: undefined,
    dispute_type: undefined,
    registration_date: undefined,
    description: undefined,
    status: undefined
  });

  const canCreateDispute = ['staf_komisi'].includes(userRole);
  const canEditDispute = ['staf_komisi', 'komisioner'].includes(userRole);

  const filteredDisputes = disputes.filter((dispute: Dispute) => {
    const matchesSearch = dispute.dispute_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (dispute.description && dispute.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createDispute.mutate(formData);
      await onDisputesUpdate();
      setFormData({
        dispute_number: '',
        dispute_type: 'sengketa_informasi',
        registration_date: new Date(),
        description: null,
        status: 'baru'
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create dispute:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.updateDispute.mutate(editFormData);
      await onDisputesUpdate();
      setShowEditDialog(false);
      setEditingDispute(null);
    } catch (error) {
      console.error('Failed to update dispute:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (dispute: Dispute) => {
    setEditingDispute(dispute);
    setEditFormData({
      id: dispute.id,
      dispute_number: dispute.dispute_number,
      dispute_type: dispute.dispute_type,
      registration_date: dispute.registration_date,
      description: dispute.description,
      status: dispute.status
    });
    setShowEditDialog(true);
  };

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Manajemen Sengketa
              </CardTitle>
              <CardDescription>
                Kelola data sengketa informasi dan status persidangan
              </CardDescription>
            </div>
            {canCreateDispute && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Sengketa Baru
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Tambah Sengketa Baru</DialogTitle>
                    <DialogDescription>
                      Isi informasi dasar untuk sengketa baru
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="dispute_number">Nomor Sengketa</Label>
                      <Input
                        id="dispute_number"
                        value={formData.dispute_number}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateDisputeInput) => ({ ...prev, dispute_number: e.target.value }))
                        }
                        placeholder="Contoh: SENGKETA/001/2024"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dispute_type">Jenis Sengketa</Label>
                      <Select
                        value={formData.dispute_type || 'sengketa_informasi'}
                        onValueChange={(value: 'sengketa_informasi' | 'keberatan' | 'banding') =>
                          setFormData((prev: CreateDisputeInput) => ({ ...prev, dispute_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sengketa_informasi">Sengketa Informasi</SelectItem>
                          <SelectItem value="keberatan">Keberatan</SelectItem>
                          <SelectItem value="banding">Banding</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="registration_date">Tanggal Pendaftaran</Label>
                      <Input
                        id="registration_date"
                        type="date"
                        value={formData.registration_date.toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateDisputeInput) => ({ 
                            ...prev, 
                            registration_date: new Date(e.target.value) 
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Deskripsi</Label>
                      <Textarea
                        id="description"
                        value={formData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateDisputeInput) => ({ 
                            ...prev, 
                            description: e.target.value || null 
                          }))
                        }
                        placeholder="Deskripsi singkat sengketa..."
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
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nomor sengketa atau deskripsi..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="baru">Baru</SelectItem>
                <SelectItem value="sedang_berjalan">Sedang Berjalan</SelectItem>
                <SelectItem value="selesai">Selesai</SelectItem>
                <SelectItem value="ditutup">Ditutup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          {filteredDisputes.length === 0 ? (
            <Alert>
              <AlertDescription>
                {disputes.length === 0 
                  ? "Belum ada data sengketa yang terdaftar." 
                  : "Tidak ada sengketa yang cocok dengan filter pencarian."}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredDisputes.map((dispute: Dispute) => (
                <Card key={dispute.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {dispute.dispute_number}
                          </h3>
                          <Badge variant={getStatusBadgeVariant(dispute.status)}>
                            {getStatusLabel(dispute.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Jenis:</span> {getDisputeTypeLabel(dispute.dispute_type)}
                        </p>
                        {dispute.description && (
                          <p className="text-sm text-gray-700 mb-3">{dispute.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Didaftarkan: {dispute.registration_date.toLocaleDateString('id-ID')}</span>
                          <span>Dibuat: {dispute.created_at.toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                        {canEditDispute && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(dispute)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Sengketa</DialogTitle>
            <DialogDescription>
              Ubah informasi sengketa {editingDispute?.dispute_number}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit_dispute_number">Nomor Sengketa</Label>
              <Input
                id="edit_dispute_number"
                value={editFormData.dispute_number || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateDisputeInput) => ({ ...prev, dispute_number: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_dispute_type">Jenis Sengketa</Label>
              <Select
                value={editFormData.dispute_type || 'sengketa_informasi'}
                onValueChange={(value: 'sengketa_informasi' | 'keberatan' | 'banding') =>
                  setEditFormData((prev: UpdateDisputeInput) => ({ ...prev, dispute_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sengketa_informasi">Sengketa Informasi</SelectItem>
                  <SelectItem value="keberatan">Keberatan</SelectItem>
                  <SelectItem value="banding">Banding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_status">Status</Label>
              <Select
                value={editFormData.status || 'baru'}
                onValueChange={(value: 'baru' | 'sedang_berjalan' | 'selesai' | 'ditutup') =>
                  setEditFormData((prev: UpdateDisputeInput) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baru">Baru</SelectItem>
                  <SelectItem value="sedang_berjalan">Sedang Berjalan</SelectItem>
                  <SelectItem value="selesai">Selesai</SelectItem>
                  <SelectItem value="ditutup">Ditutup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_description">Deskripsi</Label>
              <Textarea
                id="edit_description"
                value={editFormData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: UpdateDisputeInput) => ({ 
                    ...prev, 
                    description: e.target.value || null 
                  }))
                }
                placeholder="Deskripsi singkat sengketa..."
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
