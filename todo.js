'use strict';


const store = new Vuex.Store({
  state: {
    todos: [],
    uid: 0,
    newTodo: '',
    beforeEditCache: '',
    editedTodo: null,
    visibility: 'all'
  },

  getters: {
    all: state => state.todos,
    active: state => state.todos.filter( todo => !todo.completed ),
    completed: state => state.todos.filter( todo => todo.completed )
  },

  mutations: {
    addTodo: (state, value) => state.todos.push({
      id: state.uid++,
      title: value,
      completed: false
    }) && (state.newTodo = ''),

    allDone: (state, value) => state.todos.forEach(todo => todo.completed = value),

    cancelEdit: (state, todo) => (state.editedTodo = null) || (state.todos[state.todos.indexOf(todo)].title = state.beforeEditCache),

    doneEdit: (state, todo) => state.editedTodo && ((state.editedTodo = null) ||
      (todo.title.trim() ? (state.todos[state.todos.indexOf(todo)].title = todo.title.trim()) : state.todos.splice(state.todos.indexOf(todo), 1))),

    editTodo: (state, todo) => (state.editedTodo = todo) && (state.beforeEditCache = todo.title),

    fetchTodos: state => (state.todos = JSON.parse(localStorage
      .getItem("STORAGE_KEY") || '[]')) && state.todos
        .forEach( function(todo, index) { todo.id = index }) ||
          (state.uid = state.todos.length),

    removeCompleted: state => state.todos = state.todos.filter( todo => !todo.completed ),

    removeTodo: (state, todo) => state.todos.splice(state.todos.indexOf(todo), 1),

    saveTodos: state => localStorage.setItem("STORAGE_KEY", JSON.stringify(state.todos)),

    onHashChange: state => {
      let visibility = window.location.hash.replace(/#\/?/, '');
      (~(['active', 'completed'].indexOf(visibility)) && (state.visibility = visibility)) || (state.visibility = 'all') && (window.location.hash = '');
    },

    setNewTodo: (state, value) => state.newTodo = value,

    completeTodo: (state, todo) => state.todos[state.todos.indexOf(todo)].completed = !todo.completed,
    changeTodoTitle: (state, params) => state.todos[state.todos.indexOf(params[0])].title = params[1],
  },

  actions: {
    addTodoIn: ({commit}, value) => commit('addTodo', value),
    allDoneIn: ({commit}, value) => commit('allDone', value),
    cancelEdit: ({commit}, value) => commit('cancelEdit', value),
    doneEdit: ({commit}, todo) => commit('doneEdit', todo),
    editTodo: ({commit}, todo) => commit('editTodo', todo),
    removeCompleted: ({commit}) => commit('removeCompleted'),
    removeTodo: ({commit}, todo) => commit('removeTodo', todo),
    saveTodos: ({commit}) => commit('saveTodos'),
    onHashChange: ({commit}) => commit('onHashChange'),
    setNewTodo: ({commit}, value) => commit('setNewTodo', value),
    completeTodo: ({commit}, todo) => commit('completeTodo', todo),
    changeTodoTitle: ({commit}, params) => commit('changeTodoTitle', params),
    fetchTodos: ({commit}) => commit('fetchTodos'),
  }
});


const app = new Vue({
  el: '#app',
  store,

  computed: {

    ...Vuex.mapState({
      todos: state => state.todos,
      newTodo: state => state.newTodo,
      editedTodo: state => state.editedTodo,
      visibility: state => state.visibility
    }),

    ...Vuex.mapGetters([
      'all', 'active', 'completed'
    ]),

    ...{
      filteredTodos: function() {
        switch (this.visibility) {
          case 'all': return this.all;
          case 'active': return this.active;
          case 'completed': return this.completed;
        }
      },

      remaining: function() {
        return this.active.length;
      },

      allDone: function() {
        return this.remaining === 0;
      }
    }
  },

  methods: {
    ...Vuex.mapActions([
    'addTodoIn','allDoneIn', 'cancelEdit', 'doneEdit', 'editTodo', 'onHashChange', 'removeCompleted', 'removeTodo', 'saveTodos',
    'setNewTodo', 'completeTodo', 'changeTodoTitle', 'fetchTodos'
    ]),
    ...{
      addTodo: function() {
        let value = this.newTodo && this.newTodo.trim();
        value && this.addTodoIn(value);
      }
    }
  },

  watch: {
    todos: {
      handler: function() {
        this.saveTodos()
      },
      deep: true
    }
  },

  filters: {
    pluralize: n => n === 1 ? 'item' : 'items',
  },

  directives: {
    'todo-focus': (el, binding) => binding.value && el.focus(),
  },

  created: function() {
    window.addEventListener('hashchange', this.onHashChange);
    this.onHashChange();
    this.fetchTodos();
  },

  template: `
  <div id="app">
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <input
            class="new-todo"
            autofocus
            autocomplete="off"
            placeholder="what needs to be done?"
            @keyup.enter="addTodo"
            :value="newTodo"
            @input="setNewTodo($event.target.value)" />
      </header>

      <section class="main" v-show="todos.length" v-cloak>
        <input
            class="toggle-all"
            type="checkbox"
            :value="allDone"
            @change="allDoneIn($event.target.checked)" />

        <ul class="todo-list">
          <li
              v-for="todo in filteredTodos"
              class="todo"
              :key="todo.id"
              :class="{ completed: todo.completed, editing: todo == editedTodo }" >

            <div class="view">
              <input
                  class="toggle"
                  type="checkbox"
                  :value="todo.completed"
                  @change="completeTodo(todo)" />
              <label @dblclick="editTodo(todo)">{{ todo.title }}</label>
              <button class="destroy" @click="removeTodo(todo)"></button>
            </div>

            <input
                class="edit"
                type="text"
                v-todo-focus="todo == editedTodo"
                :value="todo.title"
                @input="changeTodoTitle([todo, $event.target.value])"
                @blur="doneEdit(todo)"
                @keyup.enter="doneEdit(todo)"
                @keyup.esc="cancelEdit(todo)" />
          </li>
        </ul>
      </section>

      <footer class="footer" v-show="todos.length" v-cloak>
        <span class="todo-count">
          <strong>{{ remaining }}</strong> {{ remaining | pluralize }} left
        </span>

        <ul class="filters">
          <li><a href="#/all" :class="{ selected: visibility == 'all' }">All</a></li>
          <li><a href="#/active" :class="{ selected: visibility == 'active' }">Active</a></li>
          <li><a href="#/completed" :class="{ selected: visibility == 'completed' }">Completed</a></li>
        </ul>

        <button
            class="clear-completed"
            v-show="todos.length > remaining"
            @click="removeCompleted">
          Clear completed
        </button>
      </footer>
    </section>

    <footer class="info">
      <p>Double-click to edit a todo</p>
      <p>Written by <a href="http://evanyou.me">Evan You</a></p>
      <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
    </footer>
  </div>
  `
});

