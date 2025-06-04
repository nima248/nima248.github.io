// Operations
const opAdd = (a, b) => Number(a) + Number(b);
const opSubtract = (a, b) => Number(a) - Number(b);
const opMultiply = (a, b) => Number(a) * Number(b);
const opDivide = (a, b) => Number(a) / Number(b);

const hasDigits = (string) => /\d/.test(string);

// Takes either a string or a number
const clamp = (num) => {
    const N_CHARS = 15;
    let num_string = String(num);
    if (num_string.includes("e+")) {
        let [a, b] = num_string.split("e+");
        let digits = N_CHARS - 2 - b.length;
        return `${a.slice(0, digits)}e+${b}`;
    }
    else {
        num_string = num_string.slice(0, N_CHARS);
        if (num_string.includes(".")) {
            num_string = num_string.
        }
    }
}


let state = {
    /* Track digit entry state
     *      -1: error
     *      0: writing first number (eq -> 2, op -> 1, digit -> 0)
     *      1: writing second number (eq -> 2, op -> 2, digit -> 1)
     *      2: result displayed (> 
     */
    _state: 0,
    _n1: "",
    _n2: "",
    _operator: null,
    _display: "",

    reset: function() {
        this._state = 0;
        this._n1 = "";
        this._display = "0";
    },

    // Digit entry
    inputDigit: function(d) {
        if (d === "0" && this._getCurrentNumber() === "0") {
            return;
        }
        this._addDigit(d);
    },
    inputDecimalPoint: function() {
        if (this._getCurrentNumber() == "") {
            this._addDigit("0");
        }
        if (this._getCurrentNumber().at(-1) == ".") {
            return;
        }
        this._addDigit(".");
    },
    _getCurrentNumber: function() {
        switch (this._state) {
            case 0:
            case 2:
                return this._n1;
            case 1:
                return this._n2;
        }
    },
    _setCurrentNumber: function(string) {
        switch (this._state) {
            case 0:
                this._n1 = string;
                break;
            case 1:
                this._n2 = string;
                break;
            case 2:
                console.error("Can't call _setCurrentNumber in state 2!");
                break;
        }
    },
    _addDigit: function(character) {
        switch (this._state) {
            case 0:
                this._n1 += character;
                break;
            case 1:
                this._n2 += character;
                break;
            case 2:
                this._n1 = character;
                this._state = 0;
                break;
        }
    },

    inputOperator: function(op) {
        if (!"+-*/=".includes(op)) {
            alert(`Bad operator input: ${op}`);
            return;
        }
        if ("+-".includes(op) && [0, 1].includes(this._state)) {
            this._setPosNeg(op);
        }

        // Can't operate on an empty number
        if (!hasDigits(this._getCurrentNumber())) {
            if (op === "=") {
                this._error();
            }
            return;
        }
        
        // Perform operation
        if (this._state === 1) {
            let f;
            switch (this._operator) {
                case "+": f = opAdd; break;
                case "-": f = opSubtract; break;
                case "*": f = opMultiply; break;
                case "/": f = opDivide; break;
            }
            this._n1 = f(this._n1, this._n2);
            this._state = op === "=" ? 0 : 1;
        }

        if (op === "=") {
            // Equals isn't remembered for future operations
            this._operator = null;
            this._n2 = "";
            this._state = 2;
        }
        else {
            this._operator = op;
            this._state = 1;
        }
    },

    _setPosNeg: function(op) {
        if (this._getCurrentNumber() === "" && op === "-") {
            this._setCurrentNumber("-");
        }
        else if (this._getCurrentNumber() === "-" && op === "+") {
            this._setCurrentNumber("");
        }
    },

    // Display text
    getDisplayText: function() {
        this._updateDisplay();
        return this._display;
    },
    _updateDisplay: function(text = null) {
        if (text) {
            this._display = text;
        }
        else {
            switch (this._state) {
                case 0:
                case 2:
                    this._display = `${clamp(this._n1)}`;
                    break;
                case 1:
                    let op;
                    switch (this._operator) {
                        case "+": op = "+"; break;
                        case "-": op = "-"; break;
                        case "*": op = String.fromCharCode(215); break;
                        case "/": op = String.fromCharCode(247); break;
                    }
                    this._display = `${clamp(this._n1)} ${op} ${clamp(this._n2)}`;
                    break;
            }
        }
        console.log(this._display);
    },
    _error: function() {
        this._updateDisplay("Error");
        this._state === -1;
    },
}


state.reset();

let buttons = document.querySelector("#buttons");
let display = document.querySelector("#display");
buttons.addEventListener("click", (e) => {
    let btn = e.target.id.replace("btn-", "");
    switch (btn) {
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
            state.inputDigit(btn);
            break;
        case "decimal":
            state.inputDecimalPoint();
            break;
        case "plus":
            state.inputOperator("+");
            break;
        case "minus":
            state.inputOperator("-");
            break;
        case "times":
            state.inputOperator("*");
            break;
        case "divide":
            state.inputOperator("/");
            break;
        case "equals":
            state.inputOperator("=");
            break;
        default:
            break;
    }
    display.textContent = state.getDisplayText();
});
