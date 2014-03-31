/**
 * @object Visualizer
 * Library that provides tools to transform data for the Visualizer module.
 */
var Visualizer = {

		toJSON : function() {
			return "Visualizer plugin";
		},

		/**
		 * @function	getTypedURL(filename)
		 * This function returns a JSON object with the URL of the file and the type.
		 * 
		 * @param	filename:string	The name of the file to handle
		 * @return	+Object
		 * 
		 **/
		getTypedURL : function(filename) {
			var extension = filename.replace(/.*\./, "").toLowerCase();
			var type = extension;
			switch (extension) {
			case "gif":
			case "png":
			case "jpeg":
			case "jpg":
			case "tif":
			case "tiff":
				return {
				type : type,
				value : File.getReadURL(filename)
			};
			case "dx":
			case "jdx":
				type = "jcamp";
				break;
			}
			return {
				type : type,
				url : File.getReadURL(filename)
			};
		},

		/**
		 * @function getMatrix(matrix, options)
		 * Returns a JSON object formatted for the matrix module
		 * 
		 * @param	matrix:+Matrix	The matrix that will be put in the object.
		 * @param	options:+Object	Object containing the options
		 * 
		 * @option	xLabel	Array containing the labels for the columns
		 * @option	yLabel	Array containing the labels for the rows
		 * 
		 * @return	+Object	The formatted matrix
		 */
		getMatrix : function(matrix, options) {

			options = options ? options : {};

			var xLabel = options.xLabel || [];
			var yLabel = options.yLabel || [];

			var formattedMatrix = {};
			formattedMatrix.type = "matrix";
			formattedMatrix.value = {};

			formattedMatrix.value.xLabel = xLabel;
			formattedMatrix.value.yLabel = yLabel;

			if (matrix instanceof Matrix) {
				formattedMatrix.value.data = matrix.toArray2D();
			} else
				throw "Visualizer.getMatrix: argument must be a Matrix object";

			return formattedMatrix;
		},

		/**
		 * @function getChart(x, y, options)
		 * Returns a JSON object formatted for the chart module
		 * 
		 * @param	x	Array of values for x
		 * @param	y	Array of values for y
		 * 
		 * option	xLabel	Label for the x axis
		 * option	yLabel	Label for the y axis
		 * @option	serieLabel	Label for the serie
		 * @option	infos	Array of information objects for each data point
		 * @option	title	Title of the chart
		 */
		getChart : function(x, y, options) {

			options = options ? options : {};

			options.xLabel = options.xLabel || "X";
			options.yLabel = options.yLabel || "Y";
			
			var chart = this.createChart();
			chart.addSerie(options.serieLabel, x, y, options.infos);
			if(options.title)
				chart.title(options.title);
			
			return chart;
		},

		/**
		 * @function createChart()
		 * Creates a new Chart object
		 * @return +Visualizer.Chart
		 */
		createChart : function() {
			return new Visualizer.Chart();
		},

		/**
		 * @function getPCAChart(pca, options)
		 * Returns a chart object populated with the given data
		 * 
		 * @param	pca:+Object		The PCA object
		 * @param	options:+Object	Object containing the options
		 * 
		 * @option	xValues	What component to use for x values (default: 1)
		 * @option	yValues	What component to use for y values (default: 2)
		 * @option	infos Array containing information objects for each 
		 * 
		 * @return +Visualizer.Chart
		 */
		getPCAChart : function(pca, options) {

			if (!pca.model || pca.model.name != "PCA")
				throw "the argument is not a valid PCA result";

			options = options ? options : {};
			var xVal = (options.xValues || 1) - 1;
			var yVal = (options.yValues || 2) - 1;
			var infos = options.infos || null;

			var data = pca.data;

			if (!data[0][xVal] || !data[0][yVal])
				throw "xValues or yValues option is wrong";

			var chart = new Visualizer.Chart().title("PCA scores");
			var serie = chart.serie("scores");

			for (var i = 0, ii = data.length; i < ii; i++) {
				var point = data[i];
				if (infos)
					serie.addPoint(point[xVal], point[yVal], infos[i]);
				else
					serie.addPoint(point[xVal], point[yVal], null);
			}

			return chart;

		},
		
		getPCALoadingPlot : function(pca, options) {
			var serie = this.getPCAChart(pca, options).chart.series[0].toJSON();
			var x = serie.x,
			    y = serie.y,
			    infos = serie.infos;
			var loading = {
					type: "loading",
					value: {
						series: [{data:[]}]
					}
			};
			var serie = loading.value.series[0].data;
			for (var i = 0; i < x.length; i++) {
				serie.push({
					w:0.2,
					c:"#000000",
					a:0,
					n:"none",
					o:1,
					lc:"#000000",
					l:i+"",
					h:0.2,
					y:y[i],
					x:x[i],
					info:infos[i]
				});
			}
			return loading;
		}
};

/**
 * @object Visualizer.Chart
 * Object that helps the creation of a chart for the visualizer
 * @constructor
 * Return a new Chart object
 * @return +Visualizer.Chart
 */
Visualizer.Chart = function() {
	this.chart = {
			type: "chart",
			value: {
				title:"",
				axis:{},
				data:[]
			}
	};
};

/**
 * @object	Visualizer.Chart.prototype
 * Methods of the Chart object
 */
Visualizer.Chart.prototype = {
		toJSON : function() {
			return this.chart;
		},
		/**
		 * @function title(name)
		 * Sets the title of the chart
		 * @param name:string New title
		 * @return !this
		 */
		title : function(name) {
			if (typeof name == "string")
				this.chart.value.title = name;
			return this;
		},

		/**
		 * @function addSerie(name, x, y, info)
		 * Adds a new serie to the chart
		 * @param name:string Name of the serie
		 * @param x:[number] Array for the x values
		 * @param y:[number] Array for the y values
		 * @param infos:[+Object] Array for the point informations
		 * @return !this
		 */
		addSerie : function(name, x, y, info) {
			var serie = new Visualizer.Chart.Serie(name).x(x).y(y).info(info);
			this.chart.value.data.push(serie);
			return this;
		},

		/**
		 * @function serie(name)
		 * Adds a new empty serie to the chart
		 * @param name:string Name of the serie
		 * @return +Visualizer.Chart.Serie
		 */
		serie : function(name) {
			var serie = new Visualizer.Chart.Serie(name);
			this.chart.value.data.push(serie);
			return serie;
		},
};
/**
 * @object Visualizer.Chart.Serie
 * Object that allows to manipulate a serie
 * @constructor
 * Create a new serie for a chart
 * @param	name:string	The name of the serie
 * @return	+Visualizer.Chart.Serie
 */
Visualizer.Chart.Serie = function(name) {
	this.value = {
			serieLabel : name,
			x : [],
			y : [],
			/*deviation: {
			top: [],
			bottom: [],
			vertical: [],
			left: [],
			right: [],
			horizontal: []
		},*/
			info : [],
			options: {}
	};
};

/**
 * @object Visualizer.Chart.Serie.prototype
 * Methods of the Serie object
 */
Visualizer.Chart.Serie.prototype = {
		toJSON : function() {
			return this.value;
		},
		/**
		 * @function x(values)
		 * Replaces the x values with the given array
		 * @param values:[number] An array containing the new x values
		 * @returns !this
		 */
		x : function(x) {
			this.value.x = x;
			return this;
		},

		/**
		 * @function y(values)
		 * Replaces the y values with the given array
		 * @param values:[number] An array containing the new y values
		 * @returns !this
		 */
		y : function(y) {
			this.value.y = y;
			return this;
		},

		/**
		 * @function info(values)
		 * Replaces the info objects with the given array
		 * @param values:[+Object] An array containing the info objects
		 * @returns !this
		 */
		info : function(info) {
			this.value.info = info;
			return this;
		},

		/**
		 * @function addPoint(x, y, info)
		 * Adds a new point to the serie
		 * @param x:number The x value
		 * @param y:number The y value
		 * @param info:+Object The info object
		 * @returns !this
		 */
		addPoint : function(x, y, info) {
			this.value.x.push(x);
			this.value.y.push(y);
			this.value.info.push(info);
			return this;
		},

		/**
		 * @function options(value)
		 * Replaces the options object with the given object
		 * @param value:+Object An object containing the new options
		 * @returns !this
		 */
		options : function(options) {
			this.value.options = options;
			return this;
		},

		/**
		 * @function option(key, value)
		 * Changes a given option
		 * @param key:string The name of the option
		 * @param value:string The new value
		 * @returns !this
		 */
		option : function(key, value) {
			if (typeof key != "string")
				return this;
			this.value.options[key] = value;
			return this;
		}
};