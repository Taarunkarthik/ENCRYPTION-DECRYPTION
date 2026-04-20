import React from 'react';
import { File, FileText, Image, Film, Music, Archive, Code, Lock } from 'lucide-react';

interface FileIconProps {
  fileName: string;
  className?: string;
}

const FileIcon: React.FC<FileIconProps> = ({ fileName, className = "w-10 h-10" }) => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  if (!ext) return <File className={className} />;

  switch (ext) {
    case 'txt':
    case 'doc':
    case 'docx':
    case 'pdf':
      return <FileText className={className} />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
      return <Image className={className} />;
    case 'mp4':
    case 'mov':
    case 'avi':
      return <Film className={className} />;
    case 'mp3':
    case 'wav':
    case 'flac':
      return <Music className={className} />;
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return <Archive className={className} />;
    case 'js':
    case 'ts':
    case 'tsx':
    case 'jsx':
    case 'html':
    case 'css':
    case 'json':
    case 'py':
    case 'java':
    case 'c':
    case 'cpp':
      return <Code className={className} />;
    case 'bin':
    case 'enc':
    case 'vault':
      return <Lock className={className} />;
    default:
      return <File className={className} />;
  }
};

export default FileIcon;
