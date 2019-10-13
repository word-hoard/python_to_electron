# Calling and interacting with a Python sub process from Electron / Node

**Problem:** Your JavaScript skills aren't as strong as your Python skills, but you want to use Python in an electron or node app. 

**Solution:** Node can run sub processes fairly straightforwardly, However, I recommend npm installing [`python-shell`](https://www.npmjs.com/package/python-shell) which is a neat and thankfully small (sub 50k) helper library for launching and talking to the sub process that will run your python scripts. 

## Ingredients:

### node
- node itself
- a basic `electron` app such as the one in this repo.
- [`python-shell`](https://www.npmjs.com/package/python-shell) 

### python
- `cmd` from the standard library.

## Method

In this example I wanted to take a html input, channel it directly to my python process and display the result back on my html page with a minimal amount of javaScript.

The downside I found to using `python-shell` was that using stdout as my communication medium, and that is not a proper messaging system. `python-shell` assumes each new line of output from the python process is a discrete response, and I wanted to use multiline output from python to generate elaborate chunks of html and svg. So you need to cache the lines as they come in, and have a simple text flag sent from python to say when a new message (`"new::msg"`) _really_ started. All of this can be put together in a quick wrapper JS class called `pythonic.js` in the `scripts` folder of my project:


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

From within an electron html page this can be used like this:


        <div id="dialog">
            <input type="text" name="pyin" id="pyin" value="hello"><br>
            <button id="ask">ask python</button><br>
            <button id="lazy">python makes a lazy button</button>
        </div>
        <div id="py_out"> </div>


      <script>
          const { PythonObject } = require('./scripts/pythonic');
          let Py = new PythonObject('./scripts/chattercmd.py', 'py_out');

          const toPy = () => {
                  let { value } = document.getElementById("pyin");
                  Py.send(`hello ${value}`);
              };

          const pyButton = () => {
              Py.send("button");
          };

          const addClick = (id, fn) => {
              document.getElementById(id).addEventListener('click', fn)
          };
          addClick('ask', toPy);
          addClick('lazy', pyButton);
      </script>

So we create a python process, specify an output tag (obviously could be refined in line with your JS skills - `innerHTML` is always a very poor choice, but will do quite a lot). Then we create and bind specific functions to send different messages to our python sub process.

Of course what we need from our python script is the ability to understand that the first word in the string sent is a function and the subsequent text is the argument(s). Thankfully that is very easy using the `cmd` module from the python standard library.


    import cmd
    from sys import stdout
    from functools import wraps

    def pyshell(func):

        @wraps(func)
        def wrapper(*args, **kwargs):
            stdout.write("new::msg\n")
            stdout.write(func(*args, **kwargs))
            stdout.write("\n")
            stdout.flush()
        return wrapper

    class Cmd_interface(cmd.Cmd):

        prompt = ""

        @pyshell
        def do_hello(self, arg):
            return f"You said hello with the following arg: {arg}"
        
        @pyshell    
        def do_bye(self, arg):
            return "You said bye!"

        @pyshell
        def do_button(self, arg):
            return """
                <button onClick="Py.send('bye')"> 
                  press me to send 'bye' 
                </button>
                """

    if __name__ == "__main__":
        Cmd_interface().cmdloop()

Reading through the code there are some useful tricks:

- Using the `cmd` library to create a persistent python process and expose as many methods / functions as you like. `cmd` is the secret hero here, and if you haven't used it before give it a spin, it is in the standard lib. The TL:DR is that you can type `hello` followed by an argument (that could be a longish string) and it will get passed to the `do_hello` method, which in the context makes it feel like a very human sort of api.
- Use a class decorator `@pyshell` to manage stdout and prepend each multiline response with `new::msg` ready for the line cache we set up in `pythonic.js`.
- Get rid of the `cmd` prompt. It will mess with your output, so `prompt = ""` is handy.

## Taking it further

This is a very hacky example that is very suited to prototyping. But there is more hackyness that could be added on:

- using your python process from within the `main.js` electron project entry point and then broadcasting results to individual pages via `ipc` is a neat strategy if you need your python process to be persistent with the lifespan of the app. The method I've shown above _is_ persistent, but only within the lifespan of the page. Navigate away from that page and the process dies.
- use `Jinja2` or another templating engine to dynamically create the entire electron app (assuming you have electron installed globally) from a data source like a yaml file. This makes for a very lightweight project overhead. Node's dependency folder `node_modules` is often a horror of huge size in many node projects, but is a tiny 48 kb if you just use `python-shell` as your only dependency and make python do all the real work. 

## Coda : Other solutions

I wrote this article a while ago and then forgot about it until a much more sophisticated python to node library was mentioned on [python bytes](https://pythonbytes.fm/episodes/show/151/certified-it-works-on-my-machine). That reminded me that I'd done the spade work on this problem and realised that it was doing no one any good just sat on my own hard drive unread.

There are other methods to communicate between node and python with other virtues: 
- [python's socket io](https://python-socketio.readthedocs.io/en/latest/intro.html#what-is-socket-io) and the [javascript io implimentation](https://socket.io/docs/) could conceivably be a very clever solution, particularly if you want to just create an interface with _just_ a static html page.

- using rpcs like this [zerorpc in electron example](https://github.com/pazrul/electron-zerorpc-example)
- [PyNode](https://thecodinginterface.com/blog/bridging-nodejs-and-python-with-pynode/) provides a highly engineered deep access to your python code from JS. 
