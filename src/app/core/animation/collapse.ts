import {
  animate,
  AnimationTriggerMetadata,
  query,
  stagger,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';

import { AnimationCurves } from './animation-consts';

export const collapseMotion: AnimationTriggerMetadata = trigger(
  'collapseMotion',
  [
    state('expanded', style({ height: '*' })),
    state('collapsed', style({ height: 0, overflow: 'hidden' })),
    state(
      'hidden',
      style({ height: 0, overflow: 'hidden', borderTopWidth: '0' })
    ),
    transition(
      'expanded => collapsed',
      animate(`150ms ${AnimationCurves.EASE_IN_OUT}`)
    ),
    transition(
      'expanded => hidden',
      animate(`150ms ${AnimationCurves.EASE_IN_OUT}`)
    ),
    transition(
      'collapsed => expanded',
      animate(`150ms ${AnimationCurves.EASE_IN_OUT}`)
    ),
    transition(
      'hidden => expanded',
      animate(`150ms ${AnimationCurves.EASE_IN_OUT}`)
    )
  ]
);

export const expandCollapse = trigger('expandCollapse', [
  state(
    'collapsed',
    style({
      height: '0',
      overflow: 'hidden'
    })
  ),
  state(
    'expanded',
    style({
      height: '*',
      overflow: 'hidden'
    })
  ),
  transition('collapsed <=> expanded', [
    animate(`150ms ${AnimationCurves.EASE_IN_OUT}`)
  ])
]);

export const treeCollapseMotion: AnimationTriggerMetadata = trigger(
  'treeCollapseMotion',
  [
    transition('* => *', [
      query(
        'trudi-tree-node:leave,trudi-tree-builtin-node:leave',
        [
          style({ overflow: 'hidden' }),
          stagger(0, [
            animate(
              `150ms ${AnimationCurves.EASE_IN_OUT}`,
              style({ height: 0, opacity: 0, 'padding-bottom': 0 })
            )
          ])
        ],
        {
          optional: true
        }
      ),
      query(
        'trudi-tree-node:enter,trudi-tree-builtin-node:enter',
        [
          style({
            overflow: 'hidden',
            height: 0,
            opacity: 0,
            'padding-bottom': 0
          }),
          stagger(0, [
            animate(
              `150ms ${AnimationCurves.EASE_IN_OUT}`,
              style({
                overflow: 'hidden',
                height: '*',
                opacity: '*',
                'padding-bottom': '*'
              })
            )
          ])
        ],
        {
          optional: true
        }
      )
    ])
  ]
);
