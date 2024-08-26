import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatParticipantName'
})
export class ParticipantPipe implements PipeTransform {
  transform(participant): string {
    if (participant.length) {
      return participant
        .map((p) =>
          (
            (p.user?.firstName ? p.user?.firstName + ' ' : '') +
            (p.user?.lastName ?? '')
          ).trim()
        )
        .join(`${participant.length === 1 ? '' : ', '}`);
    }
    return '';
  }
}
