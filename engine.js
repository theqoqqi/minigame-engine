$(function () {
    /**
     * @typedef {Object} Position Объект, хранящий координаты X и Y.
     * @property {number} x X-координата.
     * @property {number} y Y-координата.
     */

    /**
     * @typedef {Object} Dimension Объект, хранящий ширину и высоту.
     * @property {number} width Ширина.
     * @property {number} height Высота.
     */

    /**
     * @typedef {Object} Rectangle Объект, хранящий информацию о прямоугольнике.
     * @property {number} x X-координата.
     * @property {number} y Y-координата.
     * @property {number} width Ширина.
     * @property {number} height Высота.
     * @property {number} minX Минимальная X-координата.
     * @property {number} minY Минимальная Y-координата.
     * @property {number} maxX Максимальная X-координата.
     * @property {number} maxY Максимальная Y-координата.
     */

    //region Engine Vars

    let $world = $('#world');

    let worldWidth = null;
    let worldHeight = null;
    let display = function () {};
    let update = function () {};
    let onKeyUp = function () {};
    let onKeyDown = function () {};
    let onMouseUp = function () {};
    let onMouseDown = function () {};
    let pressedKeys = {};
    let pressedButtons = {};
    let mouseX = 0;
    let mouseY = 0;

    let tps = 40;
    let tickDuration = 1000 / tps;
    let lag = 0;
    let previous = 0;

    //endregion

    //region Game Lifecycle

    /**
     * Функция, которая запускает главный игровой цикл. Должна быть вызвана единожды в момент запуска игры.
     * */
    function gameLoop() {
        requestAnimationFrame(gameLoop);

        let now = window.performance.now();
        let delta = now - previous;

        if (delta > 1000) {
            delta = tickDuration;
        }

        lag += delta;

        if (lag >= tickDuration) {
            lag -= tickDuration;

            update();
        }

        let deltaTime = lag / tickDuration;

        display(deltaTime);

        previous = now;
    }

    /**
     * Устанавливает колбек, который будет вызываться каждый игровой тик.
     *
     * @param {function()} callback Функция, не принимающая параметров.
     * */
    function setUpdateCallback(callback) {
        update = callback;
    }

    /**
     * Устанавливает колбек, который будет вызываться при каждой перерисовке.
     *
     * @param {function(number)} callback Функция, принимающая время, прошедшее с прошлого игрового кадра.
     * */
    function setDisplayCallback(callback) {
        display = callback;
    }

    /**
     * Устанавливает частоту игровых тиков.
     *
     * @param {int} newTps Количество тиков в секунду.
     * */
    function setTps(newTps) {
        tps = newTps;
        tickDuration = 1000 / tps;
    }

    //endregion

    //region UI Manipulations

    /**
     * Добавляет новый элемент на нижнюю панель.
     *
     * @param {string} initialText Изначальный текст этого элемента.
     * */
    function addBarElement(initialText) {
        let $element = $(`
            <div class='stats-bar-panel'>
                ${initialText}
            </div>
        `);

        $('#stats-bar').append($element);

        return $element;
    }

    /**
     * Задает элементу нижней панели новый текст.
     *
     * @param {jQuery} $element Элемент, текст которого нужно изменить.
     * @param {string} text Новый текст этого элемента.
     * */
    function setBarElementText($element, text) {
        $element.text(text);
    }

    //endregion

    //region World Manipulations

    /**
     * Добавляет на игровое поле новый элемент.
     *
     * @param {jQuery} $element Элемент, текст которого нужно изменить.
     * */
    function addElementToWorld($element) {
        $world.append($element);
    }

    /**
     * Создает новый элемент, который можно будет добавить на игровое поле.
     *
     * @param {string} elementClass Класс элемента. Служит одновременно для определения типа элемента и как css-класс.
     *                              Может быть любой строкой, состоящей из английских букв, цифр и символов "-" и "_".
     * @param {number} x X-координата элемента.
     * @param {number} y Y-координата элемента.
     * @param {number} w Ширина элемента.
     * @param {number} h Высота элемента.
     * */
    function createElement(elementClass, x, y, w, h) {
        let $element = $(`<div class='element ${elementClass}'>`);

        setElementPosition($element, x, y);
        setElementSize($element, w, h);

        return $element;
    }

    /**
     * Изменяет размеры игрового поля.
     *
     * @param {number} width Ширина игрового поля.
     * @param {number} height Высота игрового поля.
     * */
    function setWorldSize(width, height) {
        setElementSize($world, width, height);

        worldWidth = width;
        worldHeight = height;
    }

    /**
     * Перемещает элемент в случайное свободное место, учитывая препятствия.
     *
     * @param {jQuery} $element Элемент, который нужно переместить.
     * @param {string[]} obstacleClasses Список классов, которые считаются препятствиями.
     * */
    function moveElementToRandomFreePlace($element, obstacleClasses) {
        let position = findRandomFreePlaceForElement($element, obstacleClasses);

        setElementPosition($element, position.x, position.y);
    }

    /**
     * Находит для элемента случайное свободное место, учитывая препятствия.
     *
     * @param {jQuery} $element Элемент, для которого нужно найти свободное место.
     * @param {string[]} obstacleClasses Список классов, которые считаются препятствиями.
     *
     * @return {Position} Координаты найденного свободного места.
     * */
    function findRandomFreePlaceForElement($element, obstacleClasses) {
        let position;
        let limit = 1000;

        do {
            position = getRandomPosition();

            if (limit-- === 0) {
                throw new Error('do-while limit exceeded');
            }
        } while (!isPlaceFreeForElement($element, position.x, position.y, obstacleClasses));

        return position;
    }

    /**
     * Проверяет, свободное ли указанное место для элемента, учитывая препятствия.
     *
     * @param {jQuery} $element Элемент, для которого нужно проверить свободное место.
     * @param {number} x X-координата проверяемого места.
     * @param {number} y Y-координата проверяемого места.
     * @param {string[]} obstacleClasses Список классов, которые считаются препятствиями.
     *
     * @return {boolean} <code>true</code>, если место свободно, иначе - <code>false</code>.
     * */
    function isPlaceFreeForElement($element, x, y, obstacleClasses) {
        let size = getElementSize($element);
        let newElementBounds = createBoundingRect({x, y}, size);
        let $obstacles = getAllElementsOfClasses(obstacleClasses);

        for (let $obstacle of $obstacles) {
            let obstacleBounds = getElementBoundingRect($obstacle);

            if (isRectanglesIntersects(obstacleBounds, newElementBounds)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Проверяет, пересекаются ли элементы.
     *
     * @param {jQuery} $a Первый элемент.
     * @param {jQuery} $b Второй элемент.
     *
     * @return {boolean} <code>true</code>, если элементы пересекаются, иначе - <code>false</code>.
     * */
    function isElementsIntersects($a, $b) {
        let boundsA = getElementBoundingRect($a);
        let boundsB = getElementBoundingRect($b);

        return isRectanglesIntersects(boundsA, boundsB);
    }

    /**
     * Ищет все элементы, имеющие указанные классы.
     *
     * @param {string[]} classes Список классов, по которым нужно фильтровать элементы.
     *
     * @return {jQuery[]} Список элементов, которые подходят под указанные классы.
     * */
    function getAllElementsOfClasses(classes) {
        let $elements = $world.find('.element').filter((index, element) => {
            for (let cls of classes) {
                if ($(element).hasClass(cls)) {
                    return true;
                }
            }
            return false;
        });

        return $elements.map(function () {
            return $(this);
        });
    }

    /**
     * Ищет все элементы, имеющие указанный класс.
     *
     * @param {string} elementClass Класс, по которому нужно фильтровать элементы.
     *
     * @return {jQuery[]} Список элементов, которые подходят под указанный класс.
     * */
    function getAllElementsOfClass(elementClass) {
        let $elements = $world.find('.' + elementClass);

        return $elements.map(function () {
            return $(this);
        });
    }

    /**
     * Возвращает случайную позицию на карте.
     *
     * @return {Position} Координаты случайной позиции.
     * */
    function getRandomPosition() {
        return {
            x: Math.floor(Math.random() * worldWidth),
            y: Math.floor(Math.random() * worldHeight),
        };
    }

    //endregion

    //region Element Manipulations

    /**
     * Попиксельно перемещает элемент в направлении указанной позиции, упираясь в препятствия.
     *
     * @param {jQuery} $element Элемент, который нужно переместить в указанную позицию.
     * @param {number} x X-координата позиции.
     * @param {number} y Y-координата позиции.
     * @param {string[]} obstacleClasses Список классов, которые считаются препятствиями.
     * */
    function moveElementAvoidingObstacles($element, x, y, obstacleClasses) {
        let pos = getElementPosition($element);
        let steps = Math.max(Math.abs(x), Math.abs(y));
        let xStep = x / steps;
        let yStep = y / steps;

        for (let i = 0; i < steps; i++) {
            if (xStep !== 0 && isPlaceFreeForElement($element, pos.x + xStep, pos.y, obstacleClasses)) {
                pos.x += xStep;
            }

            if (yStep !== 0 && isPlaceFreeForElement($element, pos.x, pos.y + yStep, obstacleClasses)) {
                pos.y += yStep;
            }
        }

        setElementPosition($element, pos.x, pos.y);
    }

    /**
     * Перемещает элемент на указанное расстояние.
     *
     * @param {jQuery} $element Элемент, который нужно переместить на указанное расстояние.
     * @param {number} x На сколько нужно переместить элемент по X-координате.
     * @param {number} y На сколько нужно переместить элемент по Y-координате.
     * */
    function moveElementBy($element, x, y) {
        let pos = getElementPosition($element);

        setElementPosition($element, pos.x + x, pos.y + y);
    }

    /**
     * Добавляет или удаляет элементу определенный класс.
     *
     * @param {jQuery} $element Элемент, которому нужно добавить или удалить класс.
     * @param {string} className Имя класса, который нужно добавить или удалить.
     * @param {boolean} isSet <code>true</code> - если класс нужно добавить, <code>false</code> - если удалить.
     * */
    function setElementHasClass($element, className, isSet) {
        $element.toggleClass(className, isSet);
    }

    /**
     * Проверяет, есть ли у элемента определенный класс.
     *
     * @param {jQuery} $element Элемент, у которого нужно проверить класс.
     * @param {string} className Имя класса, который нужно проверить.
     *
     * @return {boolean} <code>true</code> - если элемент имеет указанный класс, иначе - <code>false</code>.
     * */
    function isElementHasClass($element, className) {
        return $element.hasClass(className);
    }

    /**
     * Возвращает объект с информацией о прямоугольнике, описывающем занимаемую элементом область.
     *
     * @param {jQuery} $element Элемент, о занимаемой области которого нужно получить информацию.
     *
     * @return {Rectangle} прямоугольник, описывающий занимаемую элементом область.
     * */
    function getElementBoundingRect($element) {
        let position = getElementPosition($element);
        let size = getElementSize($element);

        return createBoundingRect(position, size);
    }

    /**
     * Устанавливает элементу новый размер.
     *
     * @param {jQuery} $element Элемент, которому нужно изменить размер.
     * @param {number} width Новая ширина элемента.
     * @param {number} height Новая высота элемента.
     */
    function setElementSize($element, width, height) {
        $element.css({
            width: width + 'px',
            height: height + 'px',
        });
    }

    /**
     * Возвращает размеры элемента.
     *
     * @param {jQuery} $element Элемент, размеры которого нужно получить.
     *
     * @return {Dimension} размеры указанного элемента.
     */
    function getElementSize($element) {
        return {
            width: $element.outerWidth(),
            height: $element.outerHeight(),
        };
    }

    /**
     * Устанавливает элементу новые координаты.
     *
     * @param {jQuery} $element Элемент, которому нужно изменить размер.
     * @param {number} x Новая X-координата элемента.
     * @param {number} y Новая Y-координата элемента.
     */
    function setElementPosition($element, x, y) {
        $element.data('position', {x, y});
        $element.css({
            left: x + 'px',
            top: y + 'px',
        });
    }

    /**
     * Возвращает координаты элемента.
     *
     * @param {jQuery} $element Элемент, координаты которого нужно получить.
     *
     * @return {Position} координаты указанного элемента.
     */
    function getElementPosition($element) {
        let position = $element.data('position');

        if (!position) {
            position = $element.position();
            position = {
                x: position.left,
                y: position.top,
            };

            $element.data('position', position);
        }

        return position;
    }

    //endregion

    //region Keyboard Utils

    /**
     * Активирует ввод с помощью клавиатуры.
     */
    function bindKeyboardListeners() {
        window.onkeyup = function (e) {
            pressedKeys[e.code] = false;
            onKeyUp(e);
        }

        window.onkeydown = function (e) {
            pressedKeys[e.code] = true;
            onKeyDown(e);
        }
    }

    /**
     * Устанавливает колбек на нажатия клавиш на клавиатуре.
     *
     * @param {function(e:KeyboardEvent)} listener Колбек.
     */
    function setKeyDownListener(listener) {
        onKeyDown = listener;
    }

    /**
     * Устанавливает колбек на отжатия клавиш на клавиатуре.
     *
     * @param {function(e:KeyboardEvent)} listener Колбек.
     */
    function setKeyUpListener(listener) {
        onKeyUp = listener;
    }

    /**
     * Проверяет, нажата ли на данный момент любая из указанных клавиш на клавиатуре.
     *
     * @param {string} codes Список клавиш, одна из которых может быть нажата.
     * @return {boolean} <code>true</code> - если любая из указанных клавиш нажата, иначе - <code>false</code>.
     */
    function isAnyKeyDown(...codes) {
        for (let code of codes) {
            if (isKeyDown(code)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Проверяет, нажата ли на данный момент указанная клавиша на клавиатуре.
     *
     * @param {string} code Клавиша, которая может быть нажата.
     * @return {boolean} <code>true</code> - если указанная клавиша нажата, иначе - <code>false</code>.
     */
    function isKeyDown(code) {
        return !!pressedKeys[code];
    }

    //endregion

    //region Mouse Utils

    /**
     * Активирует ввод с помощью мыши.
     */
    function bindMouseListeners() {
        window.onmouseup = function (e) {
            pressedButtons[e.button] = false;

            onMouseUp(e);
        };

        window.onmousedown = function (e) {
            pressedButtons[e.button] = true;

            onMouseDown(e);
        };

        window.onmousemove = function (e) {
            let parentOffset = $world.offset();

            mouseX = Math.floor(e.pageX - parentOffset.left);
            mouseY = Math.floor(e.pageY - parentOffset.top);
        };
    }

    /**
     * Устанавливает колбек на нажатия кнопок мыши.
     *
     * @param {function(e:MouseEvent)} listener Колбек.
     */
    function setMouseDownListener(listener) {
        onMouseDown = listener;
    }

    /**
     * Устанавливает колбек на отжатия кнопок мыши.
     *
     * @param {function(e:MouseEvent)} listener Колбек.
     */
    function setMouseUpListener(listener) {
        onMouseUp = listener;
    }

    /**
     * Проверяет, нажата ли на данный момент любая из указанных кнопок мыши.
     *
     * @param {string} buttons Список кнопок, одна из которых может быть нажата.
     * @return {boolean} <code>true</code> - если любая из указанных кнопок нажата, иначе - <code>false</code>.
     */
    function isAnyButtonDown(...buttons) {
        for (let button of buttons) {
            if (isButtonDown(button)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Проверяет, нажата ли на данный момент указанная кнопка мыши.
     *
     * @param {string} button Кнопка, которая может быть нажата.
     * @return {boolean} <code>true</code> - если указанная кнопка нажата, иначе - <code>false</code>.
     */
    function isButtonDown(button) {
        return !!pressedButtons[button];
    }

    /**
     * Возвращает текущую X-координату мыши.
     *
     * @return {number} X-координата мыши.
     */
    function getMouseX() {
        return mouseX;
    }

    /**
     * Возвращает текущую Y-координату мыши.
     *
     * @return {number} Y-координата мыши.
     */
    function getMouseY() {
        return mouseY;
    }

    //endregion

    //region Other Utils

    /**
     * Проверяет, пересекаются ли указанные прямоугольники.
     *
     * @param {Rectangle} a Первый прямоугольник.
     * @param {Rectangle} b Второй прямоугольник.
     * @return {boolean} <code>true</code> - если прямоугольники пересекаются, иначе - <code>false</code>.
     */
    function isRectanglesIntersects(a, b) {
        return a.minX < b.maxX
            && a.maxX > b.minX
            && a.minY < b.maxY
            && a.maxY > b.minY;
    }

    /**
     * Создает прямоугольник с указанными координатами и размерами.
     *
     * @param {Position} position Координаты прямоугольника
     * @param {Dimension} size Размеры прямоугольника
     * @return {Rectangle} прямоугольник с указанными координатами и размерами
     */
    function createBoundingRect(position, size) {
        return {
            x: position.x,
            y: position.y,
            width: size.width,
            height: size.height,
            minX: position.x,
            minY: position.y,
            maxX: position.x + size.width,
            maxY: position.y + size.height,
        };
    }

    //endregion

    window.engine = {
        // Game Lifecycle
        gameLoop,
        setUpdateCallback,
        setDisplayCallback,
        setTps,

        // UI Manipulations
        addBarElement,
        setBarElementText,

        // World Manipulations
        addElementToWorld,
        createElement,
        setWorldSize,
        moveElementToRandomFreePlace,
        findRandomFreePlaceForElement,
        isPlaceFreeForElement,
        isElementsIntersects,
        getAllElementsOfClasses,
        getAllElementsOfClass,
        getRandomPosition,

        // Element Manipulations
        moveElementAvoidingObstacles,
        moveElementBy,
        setElementHasClass,
        isElementHasClass,
        getElementBoundingRect,
        setElementSize,
        getElementSize,
        setElementPosition,
        getElementPosition,

        // Keyboard Utils
        bindKeyboardListeners,
        setKeyUpListener,
        setKeyDownListener,
        isAnyKeyDown,
        isKeyDown,

        // Mouse Utils
        bindMouseListeners,
        setMouseUpListener,
        setMouseDownListener,
        isAnyButtonDown,
        isButtonDown,
        getMouseX,
        getMouseY,

        // Other Utils
        isRectanglesIntersects,
        createBoundingRect,
    };
});