/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.ioxOutput = () => {
    let api;

    let elContainer;
    let elTurnIoxOnButton;
    let elTurnIoxOffButton;
    let elSendHistory;
    let elError;

    var vehicleSelectedList = document.getElementById("vehicleSelectedList");

    let errorHandler = message => {
        elError.innerHTML = message;
    };

    let pollForResult = divId => {
        setTimeout(() => {
            api.call('Get', {
                typeName: 'TextMessage',
                search: {
                    id: divId.split('-')[0]
                }
            }, testMessages => {
                if (testMessages[0].delivered) {
                    let element = document.getElementById(divId);
                    element.innerHTML += ', Delivered: ' + new Date(testMessages[0].delivered);
                } else {
                    pollForResult(divId);
                }
            }, errorHandler);
        }, 1000);
    };

    let appendAndPoll = textMessageId => {
        let divId = textMessageId + '-' + Date.now(),
            headerElement = document.createElement('h4'),
            textElement = document.createTextNode('Sent: ' + new Date());

        headerElement.setAttribute('id', divId);
        headerElement.appendChild(textElement);
        elSendHistory.appendChild(headerElement);

        pollForResult(divId);
    };

    let sendTextMessage = state => {
        let deviceId = vehicleSelectedList.getElementsByTagName('li')[0].id; 

        api.call('Add', {
            typeName: 'TextMessage',
            entity: {
                device: {
                    id: deviceId
                },
                messageContent: {
                    isRelayOn: state === 'On',
                    contentType: 'IoxOutput'
                },
                isDirectionToVehicle: true
            }
        }, appendAndPoll, errorHandler);
    };

    let sortNameEntities = (a, b) => {
        a = a.name.toLowerCase();
        b = b.name.toLowerCase();
        if (a === b) {
            return 0;
        } else if (a > b) {
            return 1;
        } else {
            return -1;
        }
    };

    var filterList = function (searchInput, Lister) {
        var input, filter, ul, li, a, i, txtValue;
        input = document.getElementById(searchInput);
        filter = input.value.toUpperCase();
        ul = document.getElementById(Lister);
        li = ul.getElementsByTagName("li");
        for (i = 0; i < li.length; i++) {
            a = li[i].getElementsByTagName("a")[0];
            txtValue = a.textContent || a.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                li[i].style.display = "";
            } else {
                li[i].style.display = "none";
            }
        }
    }

    var vehicleOnSelect = function (vehicleHtmlElement) {
        if (vehicleSelectedList.getElementsByTagName('li').length > 0) {
            var oldHtmlElement = vehicleSelectedList.getElementsByTagName('li')[0];
            oldHtmlElement.onclick = function () { vehicleOnSelect(this) };
            vehicleList.appendChild(oldHtmlElement);
        }

        vehicleHtmlElement.onclick = function () { vehicleSelectedOnSelect(this) };
        vehicleSelectedList.appendChild(vehicleHtmlElement);
        document.getElementById("turnIOXon").style.display = "inline-block";
        document.getElementById("turnIOXoff").style.display = "inline-block";
        if (vehicleHtmlElement.getAttribute('name') === "1") {
            document.getElementById("turnIOXon").disabled = false;
            document.getElementById("turnIOXoff").disabled = false;
            populateUserWhitelist(vehicleHtmlElement);
        } else {
            document.getElementById("turnIOXon").disabled = false;
            document.getElementById("turnIOXoff").disabled = false;
        }
        sortList("vehicleList");
    }

    var vehicleSelectedOnSelect = function (vehicleHtmlElement) {
        document.getElementById("turnIOXon").style.display = "none";
        document.getElementById("turnIOXoff").style.display = "none";
        vehicleHtmlElement.onclick = function(){vehicleOnSelect(this)};
        vehicleList.appendChild(vehicleHtmlElement);

        sortList("vehicleList");
    }
    
    

    var sortList = function (id) {
        var list, i, switching, b, shouldSwitch;
        list = document.getElementById(id);
        switching = true;
        while (switching) {
            switching = false;
            b = list.getElementsByTagName("LI");
            for (i = 0; i < (b.length - 1); i++) {
                shouldSwitch = false;
                if (b[i].innerHTML.toLowerCase() > b[i + 1].innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }
            if (shouldSwitch) {
                b[i].parentNode.insertBefore(b[i + 1], b[i]);
                switching = true;
            }
        }
    }
    

    var populateVehicles = function (vehicles) {
        //clear html table
        vehicleList.innerHTML = "";
        //populate html table
        for (var x = 0; x < vehicles.length; x++) {
            var element = document.createElement("LI");
            var checker = 0;
            if (vehicles[x].customParameters) {
                for (var y = 0; y < vehicles[x].customParameters.length; y++) {
                    if (vehicles[x].customParameters[y].bytes == "CA==" && vehicles[x].customParameters[y].offset == 164 && vehicles[x].customParameters[y].description == "Enable Authorised Driver List") {
                        checker = 1;
                    }
                }
            }
            element.id = vehicles[x].id;
            //When a driver is selected run function
            element.onclick = function () { vehicleOnSelect(this) };
            var divClass = document.createElement("div");
            divClass.className = "g-row checkmateListBuilderRow";
            var aClass = document.createElement("a");
            aClass.className = "g-main g-main-col";
            var divClass2 = document.createElement("div");
            divClass2.className = "g-name";
            var spanClass = document.createElement("span");
            spanClass.className = "ellipsis";
            var nameTextnode = document.createTextNode(vehicles[x].name);
            if (checker === 1) {
                spanClass.style = "color:green;font-weight:bold";
                element.setAttribute('name', 1)
            } else {

            }
            var spanClass2 = document.createElement("span");
            spanClass2.className = "secondaryData email";
            var emailTextNode = document.createTextNode(" (" + vehicles[x].serialNumber + ")");
            spanClass2.appendChild(emailTextNode);
            spanClass.appendChild(nameTextnode);
            spanClass.appendChild(spanClass2);
            divClass2.appendChild(spanClass);
            aClass.appendChild(divClass2);
            divClass.appendChild(aClass);
            element.appendChild(divClass);
            vehicleList.appendChild(element);
        }
        sortList("vehicleList");
    }    
    
    
    return {
        initialize(geotabApi, pageState, initializeCallback) {
            api = geotabApi;

            elContainer = document.getElementById('ioxoutput');
            elTurnIoxOnButton = document.getElementById('turnIOXon');
            elTurnIoxOffButton = document.getElementById('turnIOXoff');
            elSendHistory = document.getElementById('ioxoutput-history');
            elError = document.getElementById('ioxoutput-error');

            elSendHistory.innerHTML = "";

            initializeCallback();
        },
        focus(geotabApi) {
            api = geotabApi;

            api.call('Get', {
                typeName: 'Device',
                resultsLimit: 1000,
                search: {
                    fromDate: new Date().toISOString()
                }
            }, devices => {
                populateVehicles(devices);
                if (!devices || devices.length < 1) {
                    return;
                }

                devices.sort(sortNameEntities);

                for (let i = 0; i < devices.length; i++) {
                    let option = new Option();
                    option.text = devices[i].name;
                    option.value = devices[i].id;

                    var para = document.createElement("option");
                    var node = document.createTextNode(option.text);
                    node.nodeValue = option.value;
                    para.appendChild(node);
                    var element = document.getElementById("myInput");
                    element.appendChild(para);
                }

                document.getElementById('myInput').onkeyup = function () {
                    filterList("myInput", "vehicleList");
                }

                document.getElementById('myInput').onsearch = function () {
                    filterList("myInput", "vehicleList");
                } 

                elContainer.style.display = '';
            }, errorHandler);

            elTurnIoxOnButton.addEventListener('click', function () {sendTextMessage('On')});
            elTurnIoxOffButton.addEventListener('click', function () {sendTextMessage('Off')});         

        },
        blur() {
            elContainer.style.display = 'none';

        }
    };
};
