import { EMPTY, fromEvent } from 'rxjs'
import { map, debounceTime, distinctUntilChanged, switchMap, mergeMap, tap, catchError, filter } from 'rxjs/operators'
import { ajax } from 'rxjs/ajax' //позволяет делать запросы, которые сразу будут обвёрнуты в стрим.

const URL = 'https://api.github.com/search/users?q='

const search = document.getElementById('search')
const result = document.getElementById('result')


//Создадим поток, чтобы реагировать на изм.инпута, этот стрим сделан из fromEvent, данный стрим работает с сервером.
const stream$ = fromEvent(search, 'input')
  .pipe(
    map(event => event.target.value),
    debounceTime(1000),
    distinctUntilChanged(), //не делать запрос повторно, если изм. не произошло,
    //типо в инпут набрал: ма, убрал: а - получилось: м, и сново вернул а - вышло исходное.
    //distinctUntilChanged - если значение не изм. в инпуте - distinctUntilChanged не будет тригерить поток.
    tap(() => result.innerHTML = ''), //чистим пред. карточки, выводя только новые
    map(v => v.trim()),
    filter(v => v.length > 0),
    switchMap(value => ajax.getJSON(URL + value).pipe(
      catchError(err => EMPTY) //EMPTY - стрим, который завершает себя
    )), //позволяет переключится на другой стрим(он же поток)
    map(response => response.items), //достаю items из обьёкта response
    mergeMap(items => items)
  )

stream$.subscribe(user => {
  const html =
    `
      <div class="card">
        <div class="card-image">
          <img src="${user.avatar_url}" />
          <span class="card-title">${user.login}</span>
        </div>
        <div class="card-action">
          <a href="${user.html_url}" target="_blank">Открыть GitHub</a>
        </div>
      </div>
    `
  result.insertAdjacentHTML('beforeend', html)
})