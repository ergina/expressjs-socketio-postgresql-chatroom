(function ()
{
  'use strict';

  angular
  .module('chatroom', ['ui.router', 'ngStorage', 'base64', 'btford.socket-io', 'uuid', 'angularUtils.directives.dirPagination'])
  .config(routeConfig)
  .run(runBlock)
  .factory('authInterceptor', authInterceptor)
  .factory('socket', socket)
  .controller('LoginController', LoginController)
  .controller('ChatRoomController', ChatRoomController);

  /** @ngInject */
  function routeConfig($httpProvider, $stateProvider, $urlRouterProvider)
  {
    //use authInterceptor for basic authentication
    $httpProvider.interceptors.push('authInterceptor');

    $urlRouterProvider.otherwise('/login');
    // State definitions
    $stateProvider
    .state('chatroom', {
      url    : '/chatroom',
      views  : {
        'content@': {
          templateUrl: 'views/chatroom.html',
          controller : 'ChatRoomController as vm'
        }
      },
      bodyClass: 'chatroom'
    })
    .state('login', {
      url    : '/login',
      views  : {
        'content@': {
          templateUrl: 'views/login.html',
          controller : 'LoginController as vm'
        }
      },
      bodyClass: 'login'
    });
  }

  function runBlock($rootScope, $timeout, $state, $localStorage)
  {

    var stateChangeStartEvent = $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams)
    {
      if(toState.name != 'login' && (!$localStorage.user || $localStorage.user.kullaniciAdi == ''))
      {
        event.preventDefault();
        $state.go('login');
      }
    });

    // Store state in the root scope for easy access
    $rootScope.state = $state;

    // Cleanup
    $rootScope.$on('$destroy', function ()
    {
      stateChangeStartEvent();
      stateChangeSuccessEvent();
    })
  }

  function authInterceptor($localStorage)
  {
    return {
      request: function(config) {
        config.headers = config.headers || {};
        config.headers.authorization = 'Basic ' + $localStorage.token;
        if(config.method=='GET' && config.url.indexOf('user')>-1){
          var separator = config.url.indexOf('?') === -1 ? '?' : '&';
          config.url = config.url+separator+'noCache=' + new Date().getTime();
        }
        return config;
      }
    };
  }

  function socket($rootScope) {
    var socket = io.connect('http://localhost:3000', { 'forceNew': true });
    return {
      on: function (eventName, callback) {
        socket.on(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      }
    };
  }

  function LoginController($localStorage,$base64,$http,$log,$state)
  {

    //COSTANTS
    var vm = this;
    vm.form = {};

    //METHODS
    vm.yFormSubmit = yFormSubmit;
    vm.eFormSubmit = eFormSubmit;

    /**
    * Yeni Kullanıcı Kaydı
    */
    function yFormSubmit()
    {
      var obj = vm.form;
      vm.errorMessage = '';

      //boş alan kontrol
      var arr = [obj.yUserName,obj.yPassword,obj.yPassword2];
      var check = ifEmpty(arr);
      if (!check){
        vm.errorMessage = 'Tüm alanları doldurun';
        return;
      }

      //şifre eşleşme kontrol
      if (obj.yPassword !=obj.yPassword2){
        vm.errorMessage = 'Şifre alanları eşleşmeli';
        obj.yPassword = '', obj.yPassword2 = '';
        return;
      }

      //kullanıcı kayıt işlemi
      var data = {
        kullaniciAdi: obj.yUserName,
        sifre: obj.yPassword
      };
      $http.post('/user', data).then(function(resp){
        $localStorage.token = $base64.encode(obj.yUserName + ":" + obj.yPassword);
        $localStorage.user = resp.data;
        $state.go('chatroom');
      }, function(err){
        $log.error(err.data.stack);
        vm.errorMessage = "Geçersiz kullanıcı";
      });
    }

    /**
    * Mevcut Kullanıcı Girişi
    */
    function eFormSubmit()
    {
      var obj = vm.form;
      vm.errorMessage = '';

      //boş alan kontrol
      var arr = [obj.eUserName,obj.ePassword];
      var check = ifEmpty(arr);
      if (!check){
        vm.errorMessage = 'Tüm alanları doldurun';
        return;
      }

      //kullanıcı teyit işlemi
      var data = {
        kullaniciAdi: obj.eUserName,
        sifre: obj.ePassword
      };
      $localStorage.token = $base64.encode(obj.eUserName + ":" + obj.ePassword);
      $http.get('/user/'+obj.eUserName).then(function(resp){
        $localStorage.user = resp.data;
        $state.go('chatroom');
      }, function(err){
        $log.error(err.data.stack);
        vm.errorMessage = "Geçersiz kullanıcı";
      });
    }

    function ifEmpty(arr){
      for (var i = 0; i < arr.length; i++) {
        if (!arr[i] || arr[i] == "") return false;
      }
      return true;
    }


  }

  function ChatRoomController($localStorage,$http,socket,$log,uuid)
  {
    //COSTANTS
    var vm = this;

    vm.user = $localStorage.user;
    vm.mesajlar = new Array(0);
    vm.dtDefaults = {total_count:0,itemsPerPage:8,currentPage:1};

    /**
    * Initialize
    */
    ArsivGetir(1);

    //SOCKET

    /**
    * Sunucuya bağlanan bilgisi gönder
    */
    socket.on('connect', function(data) {
      socket.emit('connected person', $localStorage.user.kullaniciAdi);
    });

    /**
    * Yeni kullanıcı bağlandı bilgisini al
    */
    socket.on('user connected', function(peopleOnline){
      $log.debug(peopleOnline.justJoined + ' bağlandı.');
      $log.debug(peopleOnline.count + ' kişi online!');
      vm.peopleOnline = peopleOnline;
    });

    /**
    * Bir kullanıcı ayrıldı bilgisini al
    */
    socket.on('user disconnected', function(peopleOnline){
      $log.debug(peopleOnline.justLeft + ' ayrıldı.');
      $log.debug(peopleOnline.count + ' kişi online!');
      vm.peopleOnline = peopleOnline;
    });

    socket.on('yeni mesaj', function(mesaj) {
      if (vm.mesajlar.length == 8) vm.mesajlar.splice(0,1);
      vm.mesajlar.push(mesaj);
      vm.dtDefaults.total_count++;
    });

    //METHODS
    vm.MesajGonder = MesajGonder;
    vm.ArsivGetir = ArsivGetir;

    /**
    * Yeni Mesaj Gönder
    */
    function MesajGonder()
    {
      if (vm.dtDefaults.currentPage != 1){
        ArsivGetir(1, MesajEmit);
        vm.dtDefaults.currentPage = 1;
      } else MesajEmit();
    }

    function MesajEmit() {
      var mesajObj = {gonderen_id: vm.user.id, mesaj: vm.mesaj};
      vm.mesaj = '';

      socket.emit('yeni mesaj', mesajObj);
    }

    /**
    * Girişte geçmiş mesajları getir
    */
    function ArsivGetir(page, callback)
    {
      // $http.get('/mesaj/arsiv').then(function(resp){
      //   vm.dtDefaults.total_count = resp.data.length;
      // }, function(err){
      //   $log.error(err.data.stack);
      // });

      $http.get('/mesaj/arsiv/'+ 8*(page-1) +'/8').then(function(resp){
        vm.mesajlar = new Array(0);
        vm.mesajlar = resp.data.rows;
        vm.dtDefaults.total_count = resp.data.count;
        if (callback) callback();
      }, function(err){
        $log.error(err.data.stack);
      });
    }
  }
})();
