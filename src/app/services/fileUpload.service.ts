import { Injectable } from '@angular/core';
import { PropertiesService } from './properties.service';
import { users } from 'src/environments/environment';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { map, mergeMap, retry, tap } from 'rxjs';
import { FilesService } from './files.service';
import uuid4 from 'uuid4';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private propertyId: string;
  constructor(
    private propertyService: PropertiesService,
    private apiService: ApiService,
    private http: HttpClient,
    private filesService: FilesService
  ) {
    this.propertyService.currentProperty.subscribe((res) => {
      if (res) {
        this.propertyId = res.id;
      }
    });
  }

  async uploadToS3(file, params) {
    let location = '';

    if (file?.type?.includes('video')) {
      await this.filesService
        .generateThumbnail(file)
        .then((thumbnail: any) => {
          if (thumbnail === null) return;
          this.apiService
            .postAPI(users, 'upload/get-signed-url-put', {
              ...params,
              key: params.key + '.jpeg',
              contentType: 'image/jpeg'
            })
            .pipe(
              mergeMap((res) => {
                let body;
                try {
                  body = new Blob([thumbnail], { type: thumbnail.type });
                } catch (error) {
                  body = thumbnail;
                }
                return this.http.put(res.signedUrl, body);
              }),
              retry(3)
            )
            .toPromise();
        })
        .catch((err) => console.error(err));
    }

    return this.apiService
      .postAPI(users, 'upload/get-signed-url-put', params)
      .pipe(
        tap((res) => {
          location = res.location;
        }),
        mergeMap((res) => {
          let body;
          try {
            body = new Blob([file], { type: file.type });
          } catch (error) {
            body = file;
          }
          return this.http.put(res.signedUrl, body);
        }),
        map(() => ({
          Location: location
        })),
        retry(3)
      )
      .toPromise();
  }

  uploadFile(file) {
    return this.uploadToS3(file, {
      key: `property_files/${this.propertyId || uuid4()}/${Date.now()}/${
        file.name
      }`,
      acl: 'public-read',
      contentType: file.type
    });
  }

  uploadFile2(file, propertyId) {
    if (!file) return Promise.reject('Unknown file');
    return this.uploadToS3(file, {
      key: `property_files/${propertyId || uuid4()}/${Date.now()}/${file.name}`,
      acl: 'public-read',
      contentType: file.type || file.fileType?.name
    });
  }

  uploadFileProfile(file, propertyId) {
    if (!file) return Promise.reject('Unknown file');

    return this.uploadToS3(file, {
      key: `out_of_office_files/${propertyId || uuid4()}/${Date.now()}/${
        file.name
      }`,
      acl: 'public-read',
      contentType: file.type || file.fileType?.name
    });
  }
}
