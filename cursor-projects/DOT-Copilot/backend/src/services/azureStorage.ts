import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

class AzureStorageService {
  private containerClient: ContainerClient | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initClient();
  }

  private initClient() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'uploads';

    if (connectionString) {
      try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        this.containerClient = blobServiceClient.getContainerClient(containerName);
        this.isConfigured = true;
        console.log('Azure Storage service configured');
      } catch (error) {
        console.error('Failed to initialize Azure Storage:', error);
      }
    } else {
      console.warn('Azure Storage not configured - file uploads will fail');
    }
  }

  async uploadFile(
    file: Buffer,
    originalName: string,
    contentType: string,
    folder: string = 'uploads'
  ): Promise<{ url: string; blobName: string } | null> {
    if (!this.isConfigured || !this.containerClient) {
      console.error('Azure Storage service not configured');
      return null;
    }

    const ext = path.extname(originalName);
    const blobName = `${folder}/${uuidv4()}${ext}`;

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      await blockBlobClient.upload(file, file.length, {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
      });

      const url = blockBlobClient.url;
      
      return { url, blobName };
    } catch (error) {
      console.error('Failed to upload file to Azure Storage:', error);
      return null;
    }
  }

  async getSignedUrl(blobName: string, expiresInMinutes: number = 60): Promise<string | null> {
    if (!this.isConfigured || !this.containerClient) {
      return null;
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      // Generate SAS token
      const expiresOn = new Date();
      expiresOn.setMinutes(expiresOn.getMinutes() + expiresInMinutes);

      const sasToken = await blockBlobClient.generateSasUrl({
        permissions: 'r',
        expiresOn,
      });

      return sasToken;
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      return null;
    }
  }

  async deleteFile(blobName: string): Promise<boolean> {
    if (!this.isConfigured || !this.containerClient) {
      return false;
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
      return true;
    } catch (error) {
      console.error('Failed to delete file from Azure Storage:', error);
      return false;
    }
  }

  isReady(): boolean {
    return this.isConfigured;
  }
}

export const azureStorageService = new AzureStorageService();
export default azureStorageService;

