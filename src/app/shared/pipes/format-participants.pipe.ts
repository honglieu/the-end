import { Pipe, PipeTransform } from '@angular/core';
import { getParticipantNameDisplay } from '@/app/dashboard/modules/inbox/utils/function';
import { EUserPropertyType } from '@shared/enum/user.enum';

@Pipe({
  name: 'formatParticipants'
})
export class FormatParticipants implements PipeTransform {
  toTitleCase(input: string): string {
    return input.length === 0
      ? ''
      : input.replace(
          /\w\S*/g,
          (txt) => txt[0].toUpperCase() + txt.slice(1).toLowerCase()
        );
  }

  transform(
    value: any,
    isRmEnvironment: boolean,
    isContactType = false,
    isPrefillReceiverField = false,
    highlightUnidentifiedContact = true
  ): string {
    if (!value?.length) return '';
    return `${value
      .map((participant) => {
        let fullName = isContactType
          ? participant.label
          : getParticipantNameDisplay(participant, {
              isRmEnvironment: isRmEnvironment
            });

        if (
          !isContactType &&
          participant.type &&
          participant.type !== EUserPropertyType.UNIDENTIFIED
        ) {
          fullName = this.toTitleCase(fullName);
        }

        if (
          highlightUnidentifiedContact &&
          ((!participant.type && !isPrefillReceiverField) ||
            (participant.type === EUserPropertyType.UNIDENTIFIED &&
              !participant?.isValid))
        )
          return `<span class='unidentified-contact'>${fullName}</span>`;
        return fullName;
      })
      .join(', ')}
    `;
  }
}
