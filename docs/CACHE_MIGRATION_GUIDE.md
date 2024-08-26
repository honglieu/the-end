# Cache Migration guide

This guide is intended to help you migrate from the old state management system to the new one. The new system is based on the component state now we use the `@ngrx/store` and `indexDB` to manage the state of the application.

## Steps to migrate

### 1. Adding the sub-store for the feature

The first step is to create a sub-store for the feature. This sub-store will be used to manage the state of the feature. The sub-store will be created in the `store` folder of the feature.

for example, if we have a feature called `message` then we will create a sub-store for the message feature in the `store` folder of the message feature.


example files:
- `frontend/console-v2/src/app/store/message/message.actions.ts`
- `frontend/console-v2/src/app/store/message/message.reducer.ts`
- `frontend/console-v2/src/app/store/message/message.state.ts`
- `frontend/console-v2/src/app/store/message/message.effects.ts`

see more at: https://ngrx.io/guide/store

### 2. Preload data and save to indexDB when entering the dashboard

In `app\dashboard\resolvers\dashboard.resolver.ts` We call `DashboardSecondaryDataService` to get the data from the server and then we save the data to the store.

```typescript
    // dashboard-secondary-data.service.ts
    public loadSecondaryData() {
        return forkJoin([
        this.getMessages(),
        this.getTask()
        // TODO: add more secondary data here
    ]);
    }
  ```

Note: 
- The data loading function should return an observable of the data.
- The observable should emit the data only once and then complete.

the `loadSecondaryData` will be called in the `DashboardResolver` and the data will be saved to the store.

Save loaded data into IndexDB

```typescript
    // dashboard.resolver.ts
    private saveDataToIndexedDB(data) {
      const { messages = [] } = data ?? {};
      this.zone.runOutsideAngular(async () => {
        await lastValueFrom(this.clearIndexedDBData());
        if (!messages.length) return;
        for (const message of messages) {
          // the method `bulkAdd` not working as expected, so we use `add` instead
          this.indexedDBService
            .add(TrudiIndexedDBStorageKey.MESSAGE, message)
            .subscribe();
        }
      });
  ```

When `loadSecondaryData` is completed, the data will be saved to the store and the indexDB and the Splash screen will be hidden automatically.

**Note**: We only need to preload the data that necessary for the dashboard (aka. Secondary data), other data will be loaded when the user navigates to the feature or the detail component initially.


### 3. Select the data from the store to the component

In the component, we will use the `select` operator from `@ngrx/store` to select the data from the store.

If data being pull from store we need to override the getter and setter for the data.
- The setter will dispatch the action to update the store.
- The getter will return the data from the component state.
- Every time the data is updated in the store, the component will be updated automatically.

```typescript
  private _messageList: TaskItem[] = [];

  // setter for messageList dispatch
  public set messageList(value: TaskItem[]) {
    this.store.dispatch(
      messageActions.setAll({
        messages: value
      })
    );
  }
  // getter for messageList
  get messageList() {
    return this._messageList;
  }
  ```

Then we will use the `select` operator to select the data from the store. For more complicated data please see more at: https://ngrx.io/guide/store/selectors

```typescript
  // message-view-list.component.ts
  private onStoreChange() {
    const messages$ = this.store.select(selectAllMessage).pipe(
      tap((messages) => {
        this._messageList = this.handleMapMessageList(
          messages,
          this.selectMessageIdMap
        );
      })
    );
    const payload$ = this.store.select(selectMessagePayload);
    const fetching$ = this.store
      .select(selectFetchingMessage)
      .pipe(
        tap(
          (fetching) =>
            this.isLoading !== fetching && (this.isLoading = fetching)
        )
      );
    const fetchingMore$ = this.store
      .select(selectFetchingMoreMessage)
      .pipe(
        tap(
          (fetchingMore) =>
            this.loadingMore !== fetchingMore &&
            (this.loadingMore = fetchingMore)
        )
      );

    const total$ = this.store.select(selectTotalMessage);

    combineLatest([messages$, total$, payload$, fetching$, fetchingMore$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([messages, total, payload]) => {
        const response = {
          tasks: messages,
          currentPage: payload.page,
          totalTask: total
        };
        this.updateMessageListUIV2(response);
      });
  }
  ```

**Notes**:
- When select the data, don't re-assign the setter to the data. Instead, assign the data to the private variable.

Bad:
```typescript
    this.messageList = messages;
```

Good:
```typescript
    this._messageList = messages;
```

### 4. Update the data from component to store

When updating the component state, we will use the `setter` to update the store.

```typescript
  // message-view-list.component.ts
  public set messageList(value: TaskItem[]) {
    this.store.dispatch(
      messageActions.setAll({
        messages: value
      })
    );
  }
  ```

### 5. Remove data from the store when leaving the route

On Component destroy, we will dispatch the action to remove the data from the store.

```typescript
// message-view-list.component.ts
  ngOnDestroy() {
    this.store.dispatch(messagePageActions.exitPage());
  }
  ```

`exitPage` will be used to remove the data from the store when leaving the route or the component.

```typescript
    // message.reducer.ts
    on(messagePageActions.exitPage, (state) =>
        messageEntityAdapter.removeAll(state)
    )
  ```

**Note**: For more complex logic we could use the `@Effect` to handle the side effect when leaving the route.

```typescript
    // message.effects.ts
    exitPage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(messagePageActions.exitPage),
      tap(() => {
        // handle the side effect here
      })
    ),
    { dispatch: false }
  );
  ```

### 6. Sync the data with the indexDB

In order to sync the data with the indexDB, we will use the `@Effect` to handle the side effect when the data is updated in the store.

```typescript
  // message.effects.ts
  readonly onSetAllMessages$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(messageActions.setAll),
        concatLatestFrom(() => this.store.select(selectMessagePayload)),
        tap(([{ messages }, payload]) => {
          if (!this.hasInitiated) {
            return;
          }
          this.scheduleForLowPriorityTask(() => {
            this.syncStateAndLocalData(
              messages,
              payload as IMessageQueryParams
            );
          });
        })
      ),
    { dispatch: false }
  );
```

**Notes**: 
- the effect will be run every time the data is updated in the store. The effect will sync the data with the indexDB and then save the data to the indexDB.
- Most of the time we could just copy the code from the old effect to the new one.

### Additional notes

- The data in the indexedDb will be cleared before retrieve new data

```typescript
// dashboard.resolver.ts
  private clearIndexedDBData() {
    const tablesToClear = [
        TrudiIndexedDBStorageKey.MESSAGE,
        // Add more tables here
    ];
    const tasks: Observable<boolean>[] = [];
    for (const table of tablesToClear) {
      tasks.push(this.indexedDBService.clear(table));
    }
    return forkJoin([...tasks]);
  }
  ```

- For detail component (task detail, message detail), we need to store the data by the entity's id and select data to component using id selector

```typescript
    // message-detail.component.ts
    private onStoreChange() {
    this.store
      .select(selectMessageById(this.messageId))
      .pipe(takeUntil(this.destroy$))
      .subscribe((message) => {
        if (!message) return;
        this.message = message;
        this.isLoading = false;
      });
  }
  ```
