const { PythonShell } = require('python-shell');
    class PythonObject {
        constructor (py_script, output_id) {
            this.shell = new PythonShell(py_script);
            this.pyoutput = "";
            this.output_node = document.getElementById(output_id);
            this.shell.on('message', (message) => {this.pylinecache(message);});                
        }

        pylinecache(message) {
            message == "new::msg" ?  this.pyoutput = "" : this.pyoutput += message;
            this.output_node.innerHTML = this.pyoutput;
        }
        send(message) {
            this.shell.send(message);
        }
    }
    
    module.exports.PythonObject = PythonObject;