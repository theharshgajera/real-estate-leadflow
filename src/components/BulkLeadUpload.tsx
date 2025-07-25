import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkLeadUploadProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
}

interface LeadData {
  name: string;
  email: string;
  mobile: string;
  city: string;
}

const BulkLeadUpload = ({ isOpen, onOpenChange, onUploadComplete }: BulkLeadUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const processExcelFile = (file: File): Promise<LeadData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          // Skip the first row (headers) and process only the 4 basic fields
          const leads: LeadData[] = jsonData.slice(1).map((row: any[]) => ({
            name: String(row[0] || '').trim(),
            email: String(row[1] || '').trim(),
            mobile: String(row[2] || '').trim(),
            city: String(row[3] || '').trim()
          })).filter(lead => lead.name && lead.mobile && lead.city); // Filter out incomplete rows
          
          resolve(leads);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: 'Please select a file', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const leads = await processExcelFile(file);
      
      if (leads.length === 0) {
        toast({ title: 'No valid leads found in the file', variant: 'destructive' });
        return;
      }

      // Insert leads into database
      const { error } = await supabase
        .from('leads')
        .insert(leads.map(lead => ({
          name: lead.name,
          email: lead.email,
          mobile: lead.mobile,
          city: lead.city
        })));

      if (error) throw error;

      toast({ title: `Successfully uploaded ${leads.length} leads` });
      onUploadComplete();
      onOpenChange(false);
      setFile(null);
    } catch (error) {
      console.error('Error uploading leads:', error);
      toast({ title: 'Error uploading leads', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Upload Leads</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Excel File Format</h4>
            <p className="text-sm text-blue-700 mb-2">
              Your Excel file should have exactly 4 columns in this order:
            </p>
            <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
              <li><strong>Name</strong> (required)</li>
              <li><strong>Email</strong> (optional)</li>
              <li><strong>Phone/Mobile</strong> (required)</li>
              <li><strong>City</strong> (required)</li>
            </ol>
            <p className="text-xs text-blue-600 mt-2">
              Note: The first row will be treated as headers and ignored. Additional details like budget, requirements etc. will be filled later when users contact the leads.
            </p>
          </div>
          <div>
            <Label htmlFor="excel-file">Upload Excel File</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Upload an Excel file (.xlsx or .xls) with lead information
            </p>
          </div>
          {file && (
            <p className="text-sm">Selected file: {file.name}</p>
          )}
          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Leads'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkLeadUpload;