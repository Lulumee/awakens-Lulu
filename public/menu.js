var menuControl = {
    addUser : function (id, nick, afk, noShow) {
        var nickContain = document.createElement('div'),
            nickText = document.createElement('div'),
            extraInfo = document.createElement('div');
        
        nickContain.id = id;
        nickContain.className = 'nickContain';
        extraInfo.className = 'informer';
        nickText.className = 'nickText';
        nickText.textContent = nick;
        
        nickContain.addEventListener('click', function (e) {
            var target = e.target;
            if (target.classList.contains('nickText')) {
                menuControl.contextMenu.placeMenu(id);
            }
        });
        
        nickContain.appendChild(nickText);
        nickContain.appendChild(extraInfo);
        
        document.getElementById('userList').appendChild(nickContain);
        
        ONLINE.users[id] = {
            nick : nick,
            li : nickContain,
            resetStatus : function (idleStatus) {
                var status = this;
                if (status.idleStatus) {
                    clearTimeout(status.idleStatus);
                }
                
                if (idleStatus == 'unavailable') {
                    nickContain.children[0].classList.add('unavailable');
                } else if (idleStatus == 'away') {
                    nickContain.children[0].classList.add('away');
                    status.idleStatus = setTimeout(function () {
                        status.resetStatus('unavailable');
                    }, 3600000);
                } else {
                    nickContain.children[0].classList.remove('away', 'unavailable');
                    status.idleStatus = setTimeout(function () {
                        status.resetStatus('away');
                    }, 90000);
                }
            }
        };
        
        ONLINE.users[id].resetStatus();
        menuControl.updateCount();
        
        if (afk) {
            menuControl.afk(id, afk);
        }
        
        if (noShow === undefined) {
            messageBuilder.showMessage({
                message : nick + ' has joined',
                messageType : 'general'
            });
        }
        
        if (document.getElementsByClassName('LoginPanel').length !== 0 && nick === Attributes.get('nick')) {
            document.body.removeChild(document.getElementsByClassName('LoginPanel')[0].parentNode);
        }
    },
    idleStatus : function (id, status) {
        var user = ONLINE.users[id];
        if (user) {
            user.resetStatus(status);
        }
    },
    removeUser : function (id, part) {
        var user = ONLINE.users[id],
            pmPanel = document.getElementById('PmPanel-' + id);
        
        if (pmPanel) {
            messageBuilder.showMessage({
                message : user.nick + ' disconnected',
                messageType : 'error'
            }, pmPanel.getElementsByClassName('messages')[0]);
        }
        
        if (user.cursor) {
            user.cursor.parentNode.removeChild(user.cursor);
        }
        
        document.getElementById('userList').removeChild(user.li);
        delete ONLINE.users[id];
        
        menuControl.updateCount();

        messageBuilder.showMessage({
            message : user.nick + ' has left' + (part ? ': ' + part : ''),
            messageType : 'general'
        });
    },
    changeNick : function (id, newNick) {
        var User = ONLINE.users[id],
            nickContain = User.li.getElementsByClassName('nickText')[0];
        
        messageBuilder.showMessage({
            message : User.nick + ' is now known as ' + newNick,
            messageType : 'general'
        });
        
        nickContain.textContent = newNick;
        User.nick = newNick;
        if (User.cursor) {
            User.cursor.setAttribute('data-nick', newNick);
        }
    },
    afk : function (id, message) {
        var user = ONLINE.users[id];
        if (user) {
            user.li.getElementsByClassName('informer')[0].innerHTML = emojione.toImage(parser.escape(message.replace(/\n/g, ' '), true));
            user.resetStatus('away');
        }
    },
    updateCount : function () {
        var length = Object.keys(ONLINE.users).length;
        $$$.query('.toggle-menu span').textContent = length;
        //$$$.query('#userList').textContent = 'User list (' + length + ')';
    },
    contextMenu : {
        defaultOptions : {
            PM : {
                callback : function (nick) {
                    createPmPanel(ONLINE.getId(nick));
                }
            },
            whois : {
                callback : function (nick) {
                    clientSubmit.handleInput('/whois ' + nick);
                }
            },
            divider : '---',
            kick : {
                callback : function (nick) {
                    clientSubmit.handleInput('/kick ' + nick);
                }
            },
            ban : {
                callback : function (nick) {
                    clientSubmit.handleInput('/ban ' + nick);
                }
            },
            banip : {
                callback : function (nick) {
                    clientSubmit.handleInput('/banip ' + nick);
                }
            },
            find : {
                callback : function (nick) {
                    clientSubmit.handleInput('/find ' + nick);
                }
            }
        },
        placeMenu : function (id, options, stayOpen) {
            var options = options || this.defaultOptions,
                validUser = ONLINE.users[id],
                menu,
                userLi;
            
            function makeMenu() {
                var menuContainer = document.createElement('div'),
                    i;
                
                if (!stayOpen) {
                    menuContainer.id = 'tempMenu';
                }
                
                menuContainer.className = 'menuOptions';
                
                var keys = Object.keys(options);
                for (i = 0; i < keys.length; i++) {
                    var li = document.createElement('li'),
                        att = keys[i];
                    if (att !== 'divider') {
                        li.textContent = att;
                        li.onclick = function (e) {
                            userLi.removeChild(menuContainer);
                            options[this.textContent].callback(validUser.nick);
                        };
                    } else {
                        li.style.borderBottom = '1px solid black';
                        li.style.height = '0px';
                        li.style.padding = '0px';
                    }
                    menuContainer.appendChild(li);
                }
                
                return menuContainer;
            }
            
            if (validUser) {
                userLi = ONLINE.users[id].li;
                menu = userLi.getElementsByClassName('menuOptions');
                
                if (menu.length) {
                    userLi.removeChild(menu[0]);
                }
                menu = makeMenu();
                
                userLi.appendChild(menu);
            }
        }
    },
    HatUI : function (hats) {
        var hatNames = hats,
            i,
            hatPanel = document.getElementById('displayHats');
            
        for (i = 0; i < hatNames.length; i++) {
            var hatImg = new Image();
            hatImg.src = '/hats/' + hatNames[i];
            
            hatPanel.appendChild(hatImg);
            
            hatImg.onclick = function () {
                var split = this.src.split('/'),
                    splitUp = split[split.length - 1];

                clientSubmit.handleInput('/hat ' + splitUp.substr(0, splitUp.length - 4));
            };
        }
    },
    cursorUI : function (cursors) {
        var cursorNames = cursors,
            i,
            cursorPanel = document.getElementById('displayCursors');
            
        for (i = 0; i < cursorNames.length; i++) {
            var cursorImg = new Image();
            cursorImg.src = '/cursors/' + cursorNames[i];
            
            cursorPanel.appendChild(cursorImg);
            
            cursorImg.onclick = function () {
                var split = this.src.split('/'),
                    splitUp = split[split.length - 1];

                clientSubmit.handleInput('/cursor ' + splitUp.substr(0, splitUp.length - 4));
            }
        }
    },
    commandUI : function (commands) {
        var keys = Object.keys(commands),
            i,
            element,
            roles = ['ChannelOwner', 'Admin', 'Mod', 'Basic'],
            currentE;
        
        for (i = 0; i < keys.length; i++) {
            currentE = document.getElementById("command-" + keys[i]);
            element = document.createElement('li');
            
            if (currentE) {
                currentE.parentNode.removeChild(currentE);
            }
            
            element.id = "command-" + keys[i];
            element.textContent = keys[i];
            
            document.getElementById('cmd' + roles[commands[keys[i]] - 1]).getElementsByTagName('ul')[0].appendChild(element);
        }
    },
    styleUI : function (allProfiles) {
        var stylePanel = document.getElementById('dislayStyles').getElementsByClassName('savedStyle'),
            profile,
            flair,
            hat,
            message,
            i,
            trashcan;
        
        for (i = 0; i < stylePanel.length; i++) {
            profile = document.createElement('div'),
            flair = document.createElement('div'),
            hat = document.createElement('div'),
            message = document.createElement('div'),
            
            hat.className = 'hat';
            flair.className = 'nick';
            profile.className = 'message';

            profile.appendChild(hat);
            profile.appendChild(flair);
            profile.appendChild(message);
            
            if (allProfiles && allProfiles[i]) {
                messageBuilder.filloutHTML({
                    hat : hat,
                    nick : flair,
                    message : message,
                    container : profile
                }, {
                    hat : allProfiles[i].hat,
                    nick : Attributes.get('nick'),
                    flair : allProfiles[i].flair,
                    message : clientSubmit.message.decorateText('Example Text', {
                        font : allProfiles[i].font,
                        color : allProfiles[i].color,
                        bgcolor : allProfiles[i].bgcolor,
                        glow : allProfiles[i].glow,
                        style : allProfiles[i].style
                    })
                });
                profile.addEventListener('click', function () {
                    var thisProfile = allProfiles[this.parentNode.id[0]],
                        keys = Object.keys(thisProfile);
                    for (var i = 0; i < keys.length; i++) {
                        Attributes.set(keys[i], thisProfile[keys[i]], true);
                    }
                    clientSubmit.handleInput('/echo Now your messages look like this');
                });
                stylePanel[allProfiles[i].num].innerHTML = '';
                stylePanel[allProfiles[i].num].className += ' flair';
                stylePanel[allProfiles[i].num].appendChild(profile);
                trashcan = document.createElement('span');
                trashcan.textContent = 'delete_forever';
                trashcan.className = 'trash';
                trashcan.addEventListener('click', function () {
                    var id = parseInt(this.parentNode.id[0] + 1);
                    this.parentNode.className = 'savedStyle';
                    this.parentNode.innerHTML = 'Save style to profile ' + id;
                    socket.emit('deleteProfile', id - 1);
                });
                stylePanel[allProfiles[i].num].appendChild(trashcan);
            }
        }
    },
    ownerUI : function (owned) {
        if (owned) {
            document.getElementById('unowned').style.display = 'none';
            document.getElementById('owned').style.display = 'block';
        }
    },
    roleUI : function (channelRoles) {
        if (channelRoles) {
            var keys = Object.keys(channelRoles),
                i,
                element,
                roles = ['Admin', 'Mod'];

            for (i = 0; i < keys.length; i++) {
                element = document.createElement('li');
                element.textContent = keys[i];
                document.getElementById('role' + roles[channelRoles[keys[i]] - 2]).getElementsByTagName('ul')[0].appendChild(element);
            }   
        }
    },
    initMissedMessages : function (socket) {
        var unread = 0;
        
        socket.on('message', function () {
            if (window.blurred && ++unread) {
                document.title = '(' + unread + ') ' + (Attributes.get('topic').value || 'Awakens - The chat that never sleeps');
            }
        });

        window.addEventListener('focus', function () {
            unread = 0;
            window.blurred = false;
            document.title = Attributes.get('topic').value || 'Awakens - The chat that never sleeps';
        });
        
        window.addEventListener('blur', function () {
            window.blurred = true;
        });
    },
    initMenuUI : function (socket) {
        socket.on('channeldata', function (channel) {
            var i;

            if (channel.users) {
                document.getElementById('userList').innerHTML = '';
                ONLINE.users = {};
                for (i = 0; i < channel.users.length; i++) {            
                    menuControl.addUser(channel.users[i].id, channel.users[i].nick, channel.users[i].afk, true);
                }
            }

            if (channel.hats) {
                menuControl.HatUI(channel.hats); 
            }

            if (channel.cursors) {
                menuControl.cursorUI(channel.cursors);
            }

            if (channel.commandRoles) {
                menuControl.commandUI(channel.commandRoles);
            }
            
            if (channel.styles) {
                menuControl.styleUI(channel.styles);
            }
        });
        
        socket.on('idleStatus', menuControl.idleStatus);
        
        socket.on('joined', menuControl.addUser);

        socket.on('nick', menuControl.changeNick);

        socket.on('typing', menuControl.typing);

        socket.on('afk', menuControl.afk);

        socket.on('left', menuControl.removeUser);
    },
    typing : function (id, typing) {
        var user = ONLINE.users[id];
        if (user) {
            if (typing) {
                user.li.children[0].classList.add('typing');
            } else {
                user.li.children[0].classList.remove('typing');
            }
        }
    }
};

(function () {
    var buttons = document.createElement('cmdOptions'),
        ownerbtn = document.createElement('button'),
        adminbtn = document.createElement('button'),
        modbtn = document.createElement('button'),
        basicbtn = document.createElement('button');
    
    buttons.id = "cmdOptions";
    ownerbtn.textContent = 'Owner';
    adminbtn.textContent = 'Admin';
    modbtn.textContent = 'Mod';
    basicbtn.textContent = 'Basic';
    
    buttons.appendChild(ownerbtn);
    buttons.appendChild(adminbtn);
    buttons.appendChild(modbtn);
    buttons.appendChild(basicbtn);
    
    ownerbtn.addEventListener('click', function (e) {
        var cmdID = this.parentNode.parentNode.id;
        clientSubmit.handleInput('/lockcommand ' + cmdID.substr(8, cmdID.length) + ' ' + '1');
    });
    
    adminbtn.addEventListener('click', function (e) {
        var cmdID = this.parentNode.parentNode.id;
        clientSubmit.handleInput('/lockcommand ' + cmdID.substr(8, cmdID.length) + ' ' + '2');
    });
    
    modbtn.addEventListener('click', function (e) {
        var cmdID = this.parentNode.parentNode.id;
        clientSubmit.handleInput('/lockcommand ' + cmdID.substr(8, cmdID.length) + ' ' + '3');
    });
    
    basicbtn.addEventListener('click', function (e) {
        var cmdID = this.parentNode.parentNode.id;
        clientSubmit.handleInput('/lockcommand ' + cmdID.substr(8, cmdID.length) + ' ' + '4');
    });
    
    document.getElementById('manageCommands').addEventListener('click', function (e) {
        var target = e.target,
            currentMenu = document.getElementById('cmdOptions');
        
        if (currentMenu) {
            currentMenu.parentNode.removeChild(currentMenu);
        }
        
        if (target.nodeName == "LI") {
            target.appendChild(buttons);
        }
    });
    
    document.getElementById('dislayStyles').addEventListener('click', function (e) {
        var target = e.target,
            ary = [];

        if (target.className == "savedStyle") {
            ary[target.id[0]] = {
                num : target.id[0],
                flair : Attributes.get('flair') || '',
                cursor : Attributes.get('cursor') || '',
                part : Attributes.get('part') || '',
                font : Attributes.get('font') || '',
                color : Attributes.get('color') || '',
                bgcolor : Attributes.get('bgcolor') || '',
                glow : Attributes.get('glow') || '',
                style : Attributes.get('style') || '',
                hat : Attributes.get('hats') || ''
            }
            menuControl.styleUI(ary);
            socket.emit('saveProfile', ary[target.id[0]]);
        }
    });
})();

(function () {
    var i,
        closing = false,
        timeOut;
    
    $$$.query('.toggle-menu').addEventListener('click', function () {
        var menuContainer = document.getElementById('menu-container'),
            messages = document.getElementById('messages'),
            currentScroll = messages.scrollTop,
            contextMenu = document.getElementById('menuOptions');

        if (closing) {
            if (contextMenu) {
                document.body.removeChild(contextMenu); 
            }
            menuContainer.style.width = '0px';
            closing = false;
            messages.scrollTop = currentScroll;
            clearTimeout(timeOut);
            timeOut = setTimeout(function () {
                menuContainer.style.display = 'none';
            }, 500);
        } else {
            menuContainer.style.width = '0px';
            menuContainer.style.display = 'flex';
            closing = true;
            messages.scrollTop = currentScroll;
            clearTimeout(timeOut);
            timeOut = setTimeout(function () {
                menuContainer.style.width = '300px';
            }, 10);
        }
    });
    
    document.body.addEventListener('mouseup', function (e) {
        var menu = document.getElementById('tempMenu'),
            target = e.target.parentNode;
        
        if (menu && menu !== target) {
            menu.parentNode.removeChild(menu);
        }
    });
})();